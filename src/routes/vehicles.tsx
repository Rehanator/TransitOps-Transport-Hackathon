import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, type Vehicle, type VehicleStatus } from "@/lib/store";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Download, FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { exportCSV, exportPDF } from "@/lib/export";

export const Route = createFileRoute("/vehicles")({ component: VehiclesPage });

const empty: Omit<Vehicle, "id"> = {
  regNumber: "", name: "", type: "Van", capacity: 1000, odometer: 0,
  acquisitionCost: 500000, status: "Available", region: "North",
};

function VehiclesPage() {
  const { vehicles, addVehicle, updateVehicle, deleteVehicle, currentRole } = useStore();
  const canEdit = currentRole === "Fleet Manager";
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<Omit<Vehicle, "id">>(empty);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (v: Vehicle) => { setEditing(v); const { id: _id, ...rest } = v; setForm(rest); setOpen(true); };

  const submit = () => {
    if (!form.regNumber.trim() || !form.name.trim()) return toast.error("Registration & name required");
    if (form.capacity <= 0) return toast.error("Capacity must be positive");
    if (editing) {
      if (form.regNumber.toLowerCase() !== editing.regNumber.toLowerCase() &&
          vehicles.some((v) => v.regNumber.toLowerCase() === form.regNumber.toLowerCase())) {
        return toast.error("Registration must be unique");
      }
      updateVehicle(editing.id, form);
      toast.success("Vehicle updated");
    } else {
      const r = addVehicle(form);
      if (!r.ok) return toast.error(r.error!);
      toast.success("Vehicle added");
    }
    setOpen(false);
  };

  const rows = vehicles.map((v) => ({
    Registration: v.regNumber, Name: v.name, Type: v.type,
    "Capacity (kg)": v.capacity, "Odometer (km)": v.odometer,
    "Acquisition Cost": v.acquisitionCost, Status: v.status, Region: v.region,
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Fleet Registry</p>
          <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => exportCSV("vehicles.csv", rows)}>
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" onClick={() => exportPDF("Vehicles", rows)}>
            <FileText className="mr-2 h-4 w-4" /> PDF
          </Button>
          {canEdit && (
            <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> New Vehicle</Button>
          )}
        </div>
      </header>

      <DataTable
        data={vehicles}
        columns={[
          { key: "regNumber", header: "Registration", accessor: (r) => r.regNumber },
          { key: "name", header: "Name", accessor: (r) => r.name },
          { key: "type", header: "Type", accessor: (r) => r.type },
          { key: "capacity", header: "Capacity (kg)", accessor: (r) => r.capacity,
            render: (r) => r.capacity.toLocaleString() },
          { key: "odometer", header: "Odometer", accessor: (r) => r.odometer,
            render: (r) => `${r.odometer.toLocaleString()} km` },
          { key: "acquisitionCost", header: "Cost", accessor: (r) => r.acquisitionCost,
            render: (r) => `₹${r.acquisitionCost.toLocaleString()}` },
          { key: "region", header: "Region", accessor: (r) => r.region },
          { key: "status", header: "Status", accessor: (r) => r.status,
            render: (r) => <StatusBadge status={r.status} /> },
        ]}
        actions={canEdit ? (row) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => openEdit(row)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => {
              deleteVehicle(row.id); toast.success("Vehicle removed");
            }}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit vehicle" : "Register vehicle"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Registration Number</Label>
              <Input value={form.regNumber} onChange={(e) => setForm({ ...form, regNumber: e.target.value })} />
            </div>
            <div className="sm:col-span-2"><Label>Model / Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div><Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as Vehicle["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Van","Truck","Bus","Car"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Region</Label>
              <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["North","South","East","West","Central"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Max Capacity (kg)</Label>
              <Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: +e.target.value })} />
            </div>
            <div><Label>Odometer (km)</Label>
              <Input type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: +e.target.value })} />
            </div>
            <div><Label>Acquisition Cost (₹)</Label>
              <Input type="number" value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: +e.target.value })} />
            </div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as VehicleStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Available","On Trip","In Shop","Retired"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Registration Document</Label>
              <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                <Upload className="h-4 w-4" />
                <span>Drop or click to upload (mock)</span>
                <input type="file" className="ml-auto text-xs" onChange={(e) => setForm({ ...form, documentUrl: e.target.files?.[0]?.name })} />
              </div>
              {form.documentUrl && <p className="mt-1 text-xs text-muted-foreground">Attached: {form.documentUrl}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{editing ? "Save changes" : "Add vehicle"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      
    </div>
  );
}

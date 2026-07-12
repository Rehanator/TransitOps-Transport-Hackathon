import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, CheckCircle2, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { exportCSV } from "@/lib/export";

export const Route = createFileRoute("/maintenance")({ component: MaintenancePage });

function MaintenancePage() {
  const { maintenance, vehicles, openMaintenance, closeMaintenance, deleteMaintenance, currentRole } = useStore();
  const canEdit = currentRole === "Fleet Manager";
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    vehicleId: "", startDate: new Date().toISOString().slice(0, 10),
    description: "", cost: 0,
  });

  const submit = () => {
    if (!form.vehicleId) return toast.error("Select vehicle");
    if (!form.description.trim()) return toast.error("Description required");
    openMaintenance(form);
    toast.success("Maintenance opened; vehicle moved to In Shop");
    setOpen(false);
    setForm({ vehicleId: "", startDate: new Date().toISOString().slice(0, 10), description: "", cost: 0 });
  };

  const rows = maintenance.map((m) => ({
    ID: m.id, Vehicle: vehicles.find((v) => v.id === m.vehicleId)?.regNumber ?? "-",
    Start: m.startDate, End: m.endDate ?? "-", Description: m.description,
    Cost: m.cost, Status: m.status,
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Workshop</p>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportCSV("maintenance.csv", rows)}>
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
          {canEdit && (<Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Open Log</Button>)}
        </div>
      </header>

      <DataTable
        data={maintenance}
        columns={[
          { key: "vehicle", header: "Vehicle",
            accessor: (r) => vehicles.find((v) => v.id === r.vehicleId)?.regNumber ?? "-" },
          { key: "startDate", header: "Start", accessor: (r) => r.startDate },
          { key: "endDate", header: "End", accessor: (r) => r.endDate ?? "-" },
          { key: "description", header: "Description", accessor: (r) => r.description },
          { key: "cost", header: "Cost", accessor: (r) => r.cost,
            render: (r) => `₹${r.cost.toLocaleString()}` },
          { key: "status", header: "Status", accessor: (r) => r.status,
            render: (r) => <StatusBadge status={r.status} /> },
        ]}
        actions={canEdit ? (row) => (
          <div className="flex items-center justify-end gap-2">
            {row.status === "Open" && (
              <Button size="sm" variant="outline" onClick={() => {
                closeMaintenance(row.id, new Date().toISOString().slice(0, 10));
                toast.success("Maintenance closed; vehicle back to Available");
              }}>
                <CheckCircle2 className="mr-1 h-3 w-3" /> Close
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              aria-label="Delete maintenance log"
              onClick={() => { deleteMaintenance(row.id); toast.success("Maintenance log deleted"); }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Open maintenance log</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Vehicle</Label>
              <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {vehicles.filter((v) => v.status !== "Retired").map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.regNumber} · {v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Start Date</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div><Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div><Label>Cost (₹)</Label>
              <Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: +e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>Open log</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

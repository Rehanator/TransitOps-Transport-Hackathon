import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, isLicenseExpired, type Driver, type DriverStatus } from "@/lib/store";
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
import { Plus, Trash2, Download, FileText, AlertTriangle, Upload } from "lucide-react";
import { toast } from "sonner";
import { exportCSV, exportPDF } from "@/lib/export";

export const Route = createFileRoute("/drivers")({ component: DriversPage });

const empty: Omit<Driver, "id"> = {
  licenseNumber: "", name: "", licenseCategory: "LMV",
  licenseExpiry: new Date().toISOString().slice(0, 10),
  contact: "", safetyScore: 80, status: "Available",
};

function ScoreBar({ score }: { score: number }) {
  const barColor = score >= 80 ? "bg-green-500" :
                   score >= 60 ? "bg-orange-500" :
                   "bg-red-500";
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-medium tabular-nums">{score}</span>
    </div>
  );
}

function DriversPage() {
  const { drivers, addDriver, updateDriver, deleteDriver, currentRole } = useStore();
  const canEdit = currentRole === "Fleet Manager" || currentRole === "Safety Officer";
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState<Omit<Driver, "id">>(empty);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (d: Driver) => { setEditing(d); const { id: _id, ...rest } = d; setForm(rest); setOpen(true); };

  const submit = () => {
    if (!form.licenseNumber.trim() || !form.name.trim()) return toast.error("License & name required");
    if (form.safetyScore < 0 || form.safetyScore > 100) return toast.error("Score 0-100");
    if (editing) {
      if (form.licenseNumber.toLowerCase() !== editing.licenseNumber.toLowerCase() &&
          drivers.some((d) => d.licenseNumber.toLowerCase() === form.licenseNumber.toLowerCase())) {
        return toast.error("License must be unique");
      }
      updateDriver(editing.id, form);
      toast.success("Driver updated");
    } else {
      const r = addDriver(form);
      if (!r.ok) return toast.error(r.error!);
      toast.success("Driver added");
    }
    setOpen(false);
  };

  const rows = drivers.map((d) => ({
    License: d.licenseNumber, Name: d.name, Category: d.licenseCategory,
    Expiry: d.licenseExpiry, Contact: d.contact,
    "Safety Score": d.safetyScore, Status: d.status,
    "License Expired": isLicenseExpired(d) ? "YES" : "no",
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Workforce</p>
          <h1 className="text-3xl font-bold tracking-tight">Drivers</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => exportCSV("drivers.csv", rows)}>
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" onClick={() => exportPDF("Drivers", rows)}>
            <FileText className="mr-2 h-4 w-4" /> PDF
          </Button>
          {canEdit && (<Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> New Driver</Button>)}
        </div>
      </header>

      <DataTable
        data={drivers}
        columns={[
          { key: "licenseNumber", header: "License #", accessor: (r) => r.licenseNumber },
          { key: "name", header: "Name", accessor: (r) => r.name,
            render: (r) => (
              <div className="flex items-center gap-2">
                <span>{r.name}</span>
                {isLicenseExpired(r) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-500">
                    <AlertTriangle className="h-3 w-3" /> License expired
                  </span>
                )}
              </div>
            )},
          { key: "licenseCategory", header: "Category", accessor: (r) => r.licenseCategory },
          { key: "licenseExpiry", header: "Expiry", accessor: (r) => r.licenseExpiry },
          { key: "contact", header: "Contact", accessor: (r) => r.contact },
          { key: "safetyScore", header: "Safety Score", accessor: (r) => r.safetyScore,
            render: (r) => <ScoreBar score={r.safetyScore} /> },
          { key: "status", header: "Status", accessor: (r) => r.status,
            render: (r) => <StatusBadge status={r.status} /> },
        ]}
        actions={canEdit ? (row) => (
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => openEdit(row)}
              className="text-sm font-medium hover:underline"
            >
              Edit
            </button>
            {currentRole === "Fleet Manager" && (
              <Button size="icon" variant="ghost" onClick={() => {
                deleteDriver(row.id); toast.success("Driver removed");
              }}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit driver" : "Register driver"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>License Number</Label>
              <Input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
            </div>
            <div><Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div><Label>Category</Label>
              <Select value={form.licenseCategory} onValueChange={(v) => setForm({ ...form, licenseCategory: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["LMV","HMV","MCWG","TRANS"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>License Expiry</Label>
              <Input type="date" value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} />
            </div>
            <div><Label>Contact</Label>
              <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            </div>
            <div><Label>Safety Score (0-100)</Label>
              <Input type="number" value={form.safetyScore} onChange={(e) => setForm({ ...form, safetyScore: +e.target.value })} />
            </div>
            <div className="sm:col-span-2"><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as DriverStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Available","On Trip","Off Duty","Suspended"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>License Document</Label>
              <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                <Upload className="h-4 w-4" />
                <span>Upload license scan (mock)</span>
                <input type="file" className="ml-auto text-xs" onChange={(e) => setForm({ ...form, documentUrl: e.target.files?.[0]?.name })} />
              </div>
              {form.documentUrl && <p className="mt-1 text-xs text-muted-foreground">Attached: {form.documentUrl}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{editing ? "Save changes" : "Add driver"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

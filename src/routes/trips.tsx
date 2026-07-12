import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, isLicenseExpired, type Trip } from "@/lib/store";
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
import { Plus, Play, CheckCircle2, Ban, Download, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { exportCSV, exportPDF } from "@/lib/export";

export const Route = createFileRoute("/trips")({ component: TripsPage });

function TripsPage() {
  const store = useStore();
  const {
    trips, vehicles, drivers, currentRole,
    addTrip, dispatchTrip, completeTrip, cancelTrip, deleteTrip,
  } = store;
  const canCreate = currentRole === "Fleet Manager";
  const canOperate = currentRole === "Fleet Manager" || currentRole === "Driver";
  const canDelete = currentRole === "Fleet Manager";

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    source: "", destination: "", cargoWeight: 500, plannedDistance: 100,
    vehicleId: "", driverId: "", revenue: 20000,
  });

  const [completing, setCompleting] = useState<Trip | null>(null);
  const [compForm, setCompForm] = useState({ finalOdometer: 0, fuelConsumed: 0 });

  // Whitelisted vehicles/drivers for dispatch
  const dispatchVehicles = vehicles.filter(
    (v) => v.status === "Available",
  );
  const dispatchDrivers = drivers.filter(
    (d) => d.status === "Available" && !isLicenseExpired(d),
  );

  const submit = () => {
    if (!form.source.trim() || !form.destination.trim()) return toast.error("Source/destination required");
    if (!form.vehicleId || !form.driverId) return toast.error("Select vehicle & driver");
    const r = addTrip(form);
    if (!r.ok) return toast.error(r.error!);
    toast.success("Trip created (Draft)");
    setOpen(false);
    setForm({ source: "", destination: "", cargoWeight: 500, plannedDistance: 100, vehicleId: "", driverId: "", revenue: 20000 });
  };

  const startComplete = (t: Trip) => {
    const v = vehicles.find((x) => x.id === t.vehicleId);
    setCompleting(t);
    setCompForm({ finalOdometer: v ? v.odometer + t.plannedDistance : 0, fuelConsumed: Math.round(t.plannedDistance / 8) });
  };
  const finalizeComplete = () => {
    if (!completing) return;
    if (compForm.finalOdometer <= 0 || compForm.fuelConsumed <= 0) return toast.error("Enter valid values");
    const r = completeTrip(completing.id, compForm.finalOdometer, compForm.fuelConsumed);
    if (!r.ok) return toast.error(r.error!);
    toast.success("Trip completed");
    setCompleting(null);
  };

  const rows = trips.map((t) => {
    const v = vehicles.find((x) => x.id === t.vehicleId);
    const d = drivers.find((x) => x.id === t.driverId);
    return {
      "Trip ID": t.id, Source: t.source, Destination: t.destination,
      "Cargo (kg)": t.cargoWeight, "Distance (km)": t.plannedDistance,
      Vehicle: v?.regNumber ?? "-", Driver: d?.name ?? "-",
      Status: t.status, Revenue: t.revenue,
    };
  });

  // Driver role: only shows own trips
  const filteredTrips = currentRole === "Driver"
    ? trips.filter((t) => t.driverId === "d1") // demo user maps to d1
    : trips;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Dispatch</p>
          <h1 className="text-3xl font-bold tracking-tight">Trips</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => exportCSV("trips.csv", rows)}>
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" onClick={() => exportPDF("Trips", rows)}>
            <FileText className="mr-2 h-4 w-4" /> PDF
          </Button>
          {canCreate && (<Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> New Trip</Button>)}
        </div>
      </header>

      <DataTable
        data={filteredTrips}
        columns={[
          { key: "id", header: "Trip", accessor: (r) => r.id, render: (r) => <span className="font-mono text-xs">{r.id}</span> },
          { key: "from", header: "From", accessor: (r) => r.source,
            render: (r) => <span className="font-medium">{r.source}</span> },
          { key: "to", header: "To", accessor: (r) => r.destination,
            render: (r) => <span className="font-medium">{r.destination}</span> },
          { key: "vehicle", header: "Vehicle",
            accessor: (r) => vehicles.find((v) => v.id === r.vehicleId)?.regNumber ?? "-" },
          { key: "driver", header: "Driver",
            accessor: (r) => drivers.find((d) => d.id === r.driverId)?.name ?? "-" },
          { key: "cargo", header: "Cargo", accessor: (r) => r.cargoWeight,
            render: (r) => `${r.cargoWeight} kg` },
          { key: "distance", header: "Distance", accessor: (r) => r.plannedDistance,
            render: (r) => `${r.plannedDistance} km` },
          { key: "revenue", header: "Revenue", accessor: (r) => r.revenue,
            render: (r) => `₹${r.revenue.toLocaleString()}` },
          { key: "status", header: "Status", accessor: (r) => r.status,
            render: (r) => <StatusBadge status={r.status} /> },
        ]}
        actions={(canOperate || canDelete) ? (row) => (
          <div className="flex items-center justify-end gap-2">
            {(row.status === "Draft" || row.status === "Dispatched") && (
              <div className="flex items-center gap-2 rounded-lg border bg-muted p-1">
                {row.status === "Draft" && (
                  <Button size="sm" variant="outline" className="h-7 gap-1 px-2" onClick={() => {
                    const r = dispatchTrip(row.id);
                    r.ok ? toast.success("Dispatched") : toast.error(r.error!);
                  }}>
                    <Play className="h-3 w-3" /> Dispatch
                  </Button>
                )}
                {row.status === "Dispatched" && (
                  <>
                    <Button size="sm" variant="outline" className="h-7 gap-1 px-2" onClick={() => startComplete(row)}>
                      <CheckCircle2 className="h-3 w-3" /> Complete
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 gap-1 px-2" onClick={() => { cancelTrip(row.id); toast.success("Cancelled"); }}>
                      <Ban className="h-3 w-3" /> Cancel
                    </Button>
                  </>
                )}
              </div>
            )}
            {canDelete && (
              <Button
                size="sm"
                variant="ghost"
                aria-label="Delete trip"
                onClick={() => { deleteTrip(row.id); toast.success("Trip deleted"); }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Plan new trip</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Source</Label>
              <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
            </div>
            <div><Label>Destination</Label>
              <Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
            </div>
            <div><Label>Cargo Weight (kg)</Label>
              <Input type="number" value={form.cargoWeight} onChange={(e) => setForm({ ...form, cargoWeight: +e.target.value })} />
            </div>
            <div><Label>Planned Distance (km)</Label>
              <Input type="number" value={form.plannedDistance} onChange={(e) => setForm({ ...form, plannedDistance: +e.target.value })} />
            </div>
            <div className="sm:col-span-2"><Label>Vehicle (Available only)</Label>
              <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v })}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {dispatchVehicles.length === 0 && <div className="p-2 text-xs text-muted-foreground">No available vehicles</div>}
                  {dispatchVehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.regNumber} · {v.name} · {v.capacity}kg
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2"><Label>Driver (Available, valid license)</Label>
              <Select value={form.driverId} onValueChange={(v) => setForm({ ...form, driverId: v })}>
                <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                <SelectContent>
                  {dispatchDrivers.length === 0 && <div className="p-2 text-xs text-muted-foreground">No available drivers</div>}
                  {dispatchDrivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} · {d.licenseCategory} · Score {d.safetyScore}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2"><Label>Revenue (₹)</Label>
              <Input type="number" value={form.revenue} onChange={(e) => setForm({ ...form, revenue: +e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>Create trip</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!completing} onOpenChange={(v) => !v && setCompleting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Complete trip</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Final Odometer (km)</Label>
              <Input type="number" value={compForm.finalOdometer}
                onChange={(e) => setCompForm({ ...compForm, finalOdometer: +e.target.value })} />
            </div>
            <div><Label>Fuel Consumed (liters)</Label>
              <Input type="number" value={compForm.fuelConsumed}
                onChange={(e) => setCompForm({ ...compForm, fuelConsumed: +e.target.value })} />
            </div>
            <p className="text-xs text-muted-foreground">
              A fuel log will be created automatically.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCompleting(null)}>Cancel</Button>
            <Button onClick={finalizeComplete}>Confirm completion</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

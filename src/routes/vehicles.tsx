import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { exportCSV } from "@/lib/export";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const Route = createFileRoute("/vehicles")({
  component: () => (
    <RoleGuard allowed={["Fleet Manager"]}>
      <VehiclesPage />
    </RoleGuard>
  ),
});

interface VehicleRow {
  id: string;
  registration_number: string;
  model: string;
  max_capacity: number;
  lifetime_odometer: number;
  status: string;
  created_at: string;
}

const emptyForm = {
  registration_number: "",
  model: "",
  max_capacity: "",
  lifetime_odometer: "",
};

function VehiclesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const vehiclesQuery = useQuery({
    queryKey: ["vehicles"],
    queryFn: async (): Promise<VehicleRow[]> => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("registration_number");
      if (error) throw error;
      return (data ?? []) as VehicleRow[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const reg = form.registration_number.trim();
      const model = form.model.trim();
      const cap = Number(form.max_capacity);
      const odo = Number(form.lifetime_odometer);
      if (!reg) throw new Error("Registration number is required");
      if (!model) throw new Error("Model is required");
      if (!(cap > 0)) throw new Error("Payload capacity must be greater than 0");
      if (!(odo >= 0)) throw new Error("Lifetime odometer must be 0 or greater");
      const { error } = await supabase.from("vehicles").insert({
        registration_number: reg,
        model,
        max_capacity: cap,
        lifetime_odometer: odo,
        status: "Available",
      });
      if (error) {
        if (error.code === "23505" || error.message?.includes("vehicles_registration_number_key")) {
          throw new Error(
            `A vehicle with registration "${reg}" already exists in the registry.`,
          );
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Vehicle registered");
      setForm(emptyForm);
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["vehicles-list"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Failed to add vehicle"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vehicle removed");
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["vehicles-list"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Delete failed"),
  });

  const vehicles = vehiclesQuery.data ?? [];
  const csvRows = vehicles.map((v) => ({
    Registration: v.registration_number,
    Model: v.model,
    "Capacity (kg)": v.max_capacity,
    "Lifetime Odometer (km)": v.lifetime_odometer,
    Status: v.status,
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Master Registry
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fleet acquisition records. Lifetime odometer updates automatically
            when drivers complete trips.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => exportCSV("vehicles.csv", csvRows)}
          >
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Vehicle
          </Button>
        </div>
      </header>

      <DataTable
        data={vehicles}
        columns={[
          {
            key: "registration_number",
            header: "Registration",
            accessor: (r) => r.registration_number,
            render: (r) => (
              <span className="font-mono text-sm">{r.registration_number}</span>
            ),
          },
          { key: "model", header: "Model", accessor: (r) => r.model },
          {
            key: "capacity",
            header: "Payload Capacity",
            accessor: (r) => r.max_capacity,
            render: (r) => `${Number(r.max_capacity).toLocaleString()} kg`,
          },
          {
            key: "lifetime_odometer",
            header: "Lifetime Odometer",
            accessor: (r) => r.lifetime_odometer,
            render: (r) =>
              `${Number(r.lifetime_odometer).toLocaleString()} km`,
          },
          {
            key: "status",
            header: "Status",
            accessor: (r) => r.status,
            render: (r) => <StatusBadge status={r.status} />,
          },
        ]}
        actions={(row) => (
          <div className="flex justify-end">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                if (confirm(`Remove ${row.registration_number}?`))
                  remove.mutate(row.id);
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Register vehicle</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Vehicle registration is a one-time fleet acquisition event. Trip
            data is captured separately.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Registration Number</Label>
              <Input
                value={form.registration_number}
                onChange={(e) =>
                  setForm({ ...form, registration_number: e.target.value })
                }
                placeholder="e.g. MH12-AB-1234"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Model</Label>
              <Input
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="e.g. Tata Ace"
              />
            </div>
            <div>
              <Label>Payload Capacity (kg)</Label>
              <Input
                type="number"
                min="0"
                value={form.max_capacity}
                onChange={(e) =>
                  setForm({ ...form, max_capacity: e.target.value })
                }
                placeholder="e.g. 1000"
              />
            </div>
            <div>
              <Label>Initial Lifetime Odometer (km)</Label>
              <Input
                type="number"
                min="0"
                value={form.lifetime_odometer}
                onChange={(e) =>
                  setForm({ ...form, lifetime_odometer: e.target.value })
                }
                placeholder="e.g. 0"
              />
            </div>
            <div className="sm:col-span-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Status will be set to <strong>Available</strong> on creation.
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => create.mutate()}
              disabled={create.isPending}
            >
              {create.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
              ) : (
                "Add vehicle"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

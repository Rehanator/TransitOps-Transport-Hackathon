import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { createFuelLog, uploadFuelMedia, fetchFuelLogs } from "@/lib/fuel-logs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Truck, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/driver-portal")({
  component: DriverPortal,
});

function DriverPortal() {
  return (
    <RoleGuard allowed={["Driver"]}>
      <DriverPortalInner />
    </RoleGuard>
  );
}

function DriverPortalInner() {
  const { user } = useUser();
  const qc = useQueryClient();
  const driverId = user?.id ?? "";
  const driverEmail = user?.primaryEmailAddress?.emailAddress ?? null;

  const [vehicleId, setVehicleId] = useState("");
  const [liters, setLiters] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const vehiclesQuery = useQuery({
    queryKey: ["vehicles-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, registration_number, model")
        .order("registration_number");
      if (error) throw error;
      return data ?? [];
    },
  });

  const myLogsQuery = useQuery({
    queryKey: ["my-fuel-logs", driverId],
    enabled: !!driverId,
    queryFn: async () => {
      const all = await fetchFuelLogs();
      return all.filter((r) => r.driver_id === driverId);
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!vehicleId) throw new Error("Select a vehicle");
      const litersN = Number(liters);
      const costN = Number(cost);
      if (!(litersN > 0)) throw new Error("Liters must be greater than 0");
      if (!(costN > 0)) throw new Error("Total cost must be greater than 0");
      if (!driverId) throw new Error("Not signed in");

      const vehicle = vehiclesQuery.data?.find((v) => v.id === vehicleId);
      let mediaPath: string | null = null;
      if (file) mediaPath = await uploadFuelMedia(file, driverId);

      await createFuelLog({
        vehicleId,
        vehicleRegistration: vehicle?.registration_number ?? "",
        driverId,
        driverEmail,
        liters: litersN,
        totalCost: costN,
        notes: notes.trim() || undefined,
        mediaPath,
      });
    },
    onSuccess: () => {
      toast.success("Fuel log submitted for review");
      setVehicleId("");
      setLiters("");
      setCost("");
      setNotes("");
      setFile(null);
      qc.invalidateQueries({ queryKey: ["my-fuel-logs"] });
      qc.invalidateQueries({ queryKey: ["fuel-logs"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Submission failed"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Truck className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Driver Portal</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit fuel log</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Vehicle</Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehiclesQuery.data?.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.registration_number} — {v.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Liters filled</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={liters}
                onChange={(e) => setLiters(e.target.value)}
                placeholder="e.g. 32.5"
              />
            </div>
            <div className="grid gap-2">
              <Label>Total cost (₹)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="e.g. 3250"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Video / photo proof</Label>
            <Input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Upload a receipt photo or meter-reading video for verification.
            </p>
          </div>
          <div className="grid gap-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything the fleet manager should know"
              rows={3}
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => submit.mutate()}
              disabled={submit.isPending}
            >
              {submit.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</>
              ) : (
                <><Upload className="mr-2 h-4 w-4" /> Submit for review</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My recent submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {!myLogsQuery.data?.length ? (
            <p className="text-sm text-muted-foreground">
              No submissions yet. Your first fuel log will appear here.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {myLogsQuery.data.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                  <span className="font-medium">{r.vehicle_registration || "—"}</span>
                  <span className="text-muted-foreground">
                    {Number(r.liters).toFixed(2)} L · ₹{Number(r.total_cost).toLocaleString()}
                  </span>
                  <span className="ml-auto">
                    <StatusBadge status={r.status as string} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Pending: "bg-warning/15 text-warning border-warning/30",
    Approved: "bg-success/15 text-success border-success/30",
    Rejected: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return (
    <Badge variant="outline" className={map[status] ?? ""}>
      {status}
    </Badge>
  );
}
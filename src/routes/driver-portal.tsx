import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Fuel, Loader2, Upload, Video } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/driver-portal")({
  component: DriverPortalRoute,
});

function DriverPortalRoute() {
  return (
    <RoleGuard allowed={["Driver"]}>
      <DriverPortal />
    </RoleGuard>
  );
}

function DriverPortal() {
  const { user } = useUser();
  const driverId = user?.id ?? "";
  const driverEmail =
    user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? null;
  const qc = useQueryClient();

  const [vehicleId, setVehicleId] = useState<string>("");
  const [liters, setLiters] = useState<string>("");
  const [totalCost, setTotalCost] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const vehiclesQ = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, registration_number, model, status")
        .order("registration_number");
      if (error) throw error;
      return data ?? [];
    },
  });

  const myLogsQ = useQuery({
    queryKey: ["fuel_logs", "driver", driverId],
    enabled: !!driverId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fuel_logs")
        .select(
          "id, liters, total_cost, status, notes, media_url, reviewer_note, created_at, vehicle_registration",
        )
        .eq("driver_id", driverId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!driverId) throw new Error("Not signed in");
      if (!vehicleId) throw new Error("Select a vehicle");
      const litersNum = Number(liters);
      const costNum = Number(totalCost);
      if (!(litersNum > 0)) throw new Error("Liters must be greater than 0");
      if (!(costNum >= 0)) throw new Error("Enter a valid total cost");
      if (!videoFile) throw new Error("Attach a video of the fuel pump");
      if (videoFile.size > 50 * 1024 * 1024)
        throw new Error("Video is larger than 50 MB");

      const ext =
        videoFile.name.split(".").pop()?.toLowerCase() || "webm";
      const path = `${driverId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("fuel-videos")
        .upload(path, videoFile, {
          contentType: videoFile.type || "video/webm",
          upsert: false,
        });
      if (upErr) throw upErr;

      const vehicle = vehiclesQ.data?.find((v) => v.id === vehicleId);
      const { error: insErr } = await supabase.from("fuel_logs").insert({
        vehicle_id: vehicleId,
        vehicle_registration: vehicle?.registration_number ?? null,
        driver_id: driverId,
        driver_email: driverEmail,
        liters: litersNum,
        total_cost: costNum,
        media_url: path,
        notes: notes || null,
        status: "Pending",
      });
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      toast.success("Fuel log submitted for approval");
      setLiters("");
      setTotalCost("");
      setNotes("");
      setVideoFile(null);
      qc.invalidateQueries({ queryKey: ["fuel_logs"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Submission failed");
    },
  });

  const perLitre =
    Number(liters) > 0 ? Number(totalCost) / Number(liters) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Fuel className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Driver Portal — Fuel Submission</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log a fuel purchase</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Vehicle</Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger>
                <SelectValue placeholder="Select the vehicle you're fueling" />
              </SelectTrigger>
              <SelectContent>
                {vehiclesQ.data?.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.registration_number} — {v.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Liters filled</Label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="e.g. 42.5"
                value={liters}
                onChange={(e) => setLiters(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Total cost (₹)</Label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="e.g. 4200"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
              />
            </div>
          </div>

          {perLitre > 0 && (
            <p className="text-xs text-muted-foreground">
              ≈ ₹{perLitre.toFixed(2)} per litre
            </p>
          )}

          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Fuel pump verification video
            </Label>
            <Input
              type="file"
              accept="video/*"
              capture="environment"
              onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Record the pump display showing the amount and litres. Max 50 MB.
            </p>
            {videoFile && (
              <p className="text-xs">
                Selected: <strong>{videoFile.name}</strong> (
                {(videoFile.size / 1024 / 1024).toFixed(1)} MB)
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Notes (optional)</Label>
            <Textarea
              rows={2}
              placeholder="Odometer reading, station name, anything else…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button
            onClick={() => submit.mutate()}
            disabled={submit.isPending}
            className="w-full sm:w-auto"
          >
            {submit.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Submit for approval
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My recent submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {myLogsQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !myLogsQ.data?.length ? (
            <p className="text-sm text-muted-foreground">
              No submissions yet.
            </p>
          ) : (
            <ul className="divide-y">
              {myLogsQ.data.map((log) => (
                <li
                  key={log.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <div>
                    <div className="font-medium">
                      {log.vehicle_registration ?? "Vehicle"} —{" "}
                      {Number(log.liters).toFixed(2)} L · ₹
                      {Number(log.total_cost).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                      {log.reviewer_note ? ` · "${log.reviewer_note}"` : ""}
                    </div>
                  </div>
                  <StatusBadge status={log.status} />
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
  const variant =
    status === "Approved"
      ? "default"
      : status === "Rejected"
        ? "destructive"
        : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchFuelLogs,
  getSignedMediaUrl,
  reviewFuelLog,
  type FuelLogRow,
} from "@/lib/fuel-logs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ClipboardCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/fuel-verification")({
  component: () => (
    <RoleGuard allowed={["Fleet Manager"]}>
      <FuelVerification />
    </RoleGuard>
  ),
});

function FuelVerification() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["fuel-logs", "Pending"],
    queryFn: () => fetchFuelLogs("Pending"),
  });
  const { data: recent } = useQuery({
    queryKey: ["fuel-logs", "reviewed"],
    queryFn: async () => {
      const all = await fetchFuelLogs();
      return all.filter((r) => r.status !== "Pending").slice(0, 10);
    },
  });

  // Real-time: instantly show new driver submissions and reviewer changes.
  useEffect(() => {
    const channel = supabase
      .channel("fuel_logs:fm")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fuel_logs" },
        (payload) => {
          qc.invalidateQueries({ queryKey: ["fuel-logs"] });
          if (payload.eventType === "INSERT") {
            const row = payload.new as FuelLogRow;
            toast.info(
              `New fuel log · ${row.vehicle_registration ?? "vehicle"} · ${Number(row.liters).toFixed(2)} L`,
            );
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold">Fuel Verification</h1>
          <p className="text-sm text-muted-foreground">
            Review driver-submitted fuel logs. Approved logs are added to the
            vehicle's operational expenses.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Pending review{" "}
            {data?.length ? (
              <Badge variant="secondary" className="ml-2">{data.length}</Badge>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !data?.length ? (
            <p className="text-sm text-muted-foreground">
              No pending fuel logs. All caught up!
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {data.map((log) => (
                <PendingCard key={log.id} log={log} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {recent && recent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently reviewed</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border text-sm">
              {recent.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 py-2">
                  <span className="font-medium">{r.vehicle_registration || "—"}</span>
                  <span className="text-muted-foreground">
                    {Number(r.liters).toFixed(2)} L · ₹
                    {Number(r.total_cost).toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">
                    {r.driver_email ?? r.driver_id}
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      r.status === "Approved"
                        ? "ml-auto bg-success/15 text-success border-success/30"
                        : "ml-auto bg-destructive/15 text-destructive border-destructive/30"
                    }
                  >
                    {r.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PendingCard({ log }: { log: FuelLogRow }) {
  const { user } = useUser();
  const qc = useQueryClient();

  const mediaQuery = useQuery({
    queryKey: ["fuel-media", log.media_url],
    enabled: !!log.media_url,
    queryFn: () => getSignedMediaUrl(log.media_url as string),
  });

  const review = useMutation({
    mutationFn: (approve: boolean) =>
      reviewFuelLog({
        id: log.id,
        approve,
        reviewerId: user?.id ?? "unknown",
      }),
    onSuccess: (_d, approve) => {
      toast.success(
        approve
          ? "Approved — added to vehicle expenses"
          : "Fuel log rejected",
      );
      qc.invalidateQueries({ queryKey: ["fuel-logs"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Update failed"),
  });

  const isVideo =
    typeof log.media_url === "string" && /\.(mp4|webm|mov|m4v)$/i.test(log.media_url);

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{log.vehicle_registration || "—"}</p>
          <p className="text-xs text-muted-foreground">
            {log.driver_email ?? log.driver_id}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(log.created_at).toLocaleString()}
          </p>
        </div>
        <Badge variant="outline" className="bg-warning/15 text-warning border-warning/30">
          Pending
        </Badge>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Liters</p>
          <p className="font-medium">{Number(log.liters).toFixed(2)} L</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total cost</p>
          <p className="font-medium">₹{Number(log.total_cost).toLocaleString()}</p>
        </div>
      </div>

      {log.notes && (
        <p className="mt-2 text-sm text-muted-foreground">"{log.notes}"</p>
      )}

      <div className="mt-3 overflow-hidden rounded-md border bg-muted/40">
        {!log.media_url ? (
          <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
            No media attached
          </div>
        ) : mediaQuery.isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : !mediaQuery.data ? (
          <div className="flex h-32 items-center justify-center text-xs text-destructive">
            Media unavailable
          </div>
        ) : isVideo ? (
          <video src={mediaQuery.data} controls className="h-48 w-full object-contain" />
        ) : (
          <a href={mediaQuery.data} target="_blank" rel="noreferrer">
            <img
              src={mediaQuery.data}
              alt="Fuel proof"
              className="h-48 w-full object-contain"
            />
          </a>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          onClick={() => review.mutate(true)}
          disabled={review.isPending}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => review.mutate(false)}
          disabled={review.isPending}
        >
          <XCircle className="mr-2 h-4 w-4" /> Reject
        </Button>
      </div>
    </div>
  );
}
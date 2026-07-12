import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Check, X, ClipboardCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/fuel-approvals")({
  component: FuelApprovalsRoute,
});

function FuelApprovalsRoute() {
  return (
    <RoleGuard allowed={["Fleet Manager"]}>
      <FuelApprovals />
    </RoleGuard>
  );
}

type FuelLog = {
  id: string;
  vehicle_registration: string | null;
  driver_id: string;
  driver_email: string | null;
  liters: number;
  total_cost: number;
  media_url: string | null;
  notes: string | null;
  status: "Pending" | "Approved" | "Rejected";
  reviewer_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

function FuelApprovals() {
  const { user } = useUser();
  const reviewerId = user?.id ?? "";
  const qc = useQueryClient();
  const [tab, setTab] = useState<"Pending" | "Approved" | "Rejected">(
    "Pending",
  );

  const logsQ = useQuery({
    queryKey: ["fuel_logs", "review", tab],
    queryFn: async (): Promise<FuelLog[]> => {
      const { data, error } = await supabase
        .from("fuel_logs")
        .select(
          "id, vehicle_registration, driver_id, driver_email, liters, total_cost, media_url, notes, status, reviewer_note, reviewed_by, reviewed_at, created_at",
        )
        .eq("status", tab)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as FuelLog[];
    },
  });

  const decide = useMutation({
    mutationFn: async (args: {
      id: string;
      status: "Approved" | "Rejected";
      note: string;
    }) => {
      const { error } = await supabase
        .from("fuel_logs")
        .update({
          status: args.status,
          reviewer_note: args.note || null,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", args.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success(`Fuel log ${vars.status.toLowerCase()}`);
      qc.invalidateQueries({ queryKey: ["fuel_logs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Fuel Approvals</h1>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="Pending">Pending</TabsTrigger>
          <TabsTrigger value="Approved">Approved</TabsTrigger>
          <TabsTrigger value="Rejected">Rejected</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          {logsQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !logsQ.data?.length ? (
            <p className="text-sm text-muted-foreground">
              No {tab.toLowerCase()} submissions.
            </p>
          ) : (
            <div className="grid gap-4">
              {logsQ.data.map((log) => (
                <ApprovalCard
                  key={log.id}
                  log={log}
                  onDecide={(status, note) =>
                    decide.mutate({ id: log.id, status, note })
                  }
                  busy={decide.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ApprovalCard({
  log,
  onDecide,
  busy,
}: {
  log: FuelLog;
  onDecide: (status: "Approved" | "Rejected", note: string) => void;
  busy: boolean;
}) {
  const [note, setNote] = useState("");
  const perLitre =
    log.liters > 0 ? Number(log.total_cost) / Number(log.liters) : 0;

  const videoQ = useQuery({
    queryKey: ["fuel-video", log.media_url],
    enabled: !!log.media_url,
    staleTime: 55 * 60 * 1000,
    queryFn: async (): Promise<string | null> => {
      if (!log.media_url) return null;
      const { data, error } = await supabase.storage
        .from("fuel-videos")
        .createSignedUrl(log.media_url, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });

  const badge = useMemo(() => {
    const variant =
      log.status === "Approved"
        ? "default"
        : log.status === "Rejected"
          ? "destructive"
          : "secondary";
    return <Badge variant={variant}>{log.status}</Badge>;
  }, [log.status]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">
            {log.vehicle_registration ?? "Vehicle"} — {Number(log.liters).toFixed(2)} L
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            ₹{Number(log.total_cost).toLocaleString()} · ₹
            {perLitre.toFixed(2)}/L · {new Date(log.created_at).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            Driver: {log.driver_email ?? log.driver_id}
          </p>
        </div>
        {badge}
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <div>
          {log.media_url ? (
            videoQ.isLoading ? (
              <div className="flex h-40 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                Loading video…
              </div>
            ) : videoQ.data ? (
              <video
                src={videoQ.data}
                controls
                playsInline
                className="w-full rounded-md border bg-black"
              />
            ) : (
              <div className="flex h-40 items-center justify-center rounded-md border text-xs text-destructive">
                Failed to load video
              </div>
            )
          ) : (
            <div className="flex h-40 items-center justify-center rounded-md border text-xs text-muted-foreground">
              No video attached
            </div>
          )}
          {log.notes && (
            <p className="mt-2 text-xs text-muted-foreground">
              Driver notes: {log.notes}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          {log.status === "Pending" ? (
            <>
              <label className="text-xs font-medium">Reviewer note (optional)</label>
              <Textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Reason, follow-up, etc."
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => onDecide("Approved", note)}
                  disabled={busy}
                  className="flex-1"
                >
                  {busy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => onDecide("Rejected", note)}
                  disabled={busy}
                  className="flex-1"
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </>
          ) : (
            <div className="text-sm">
              <p>
                <span className="text-muted-foreground">Reviewed:</span>{" "}
                {log.reviewed_at
                  ? new Date(log.reviewed_at).toLocaleString()
                  : "—"}
              </p>
              {log.reviewer_note && (
                <p className="mt-1">
                  <span className="text-muted-foreground">Note:</span>{" "}
                  {log.reviewer_note}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
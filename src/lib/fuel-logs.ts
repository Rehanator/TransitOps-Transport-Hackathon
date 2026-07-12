import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type FuelLogRow = Database["public"]["Tables"]["fuel_logs"]["Row"];
export type FuelLogStatus = "Pending" | "Approved" | "Rejected";

const BUCKET = "fuel-videos";

export async function uploadFuelMedia(file: File, driverId: string): Promise<string> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${driverId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return path;
}

export async function getSignedMediaUrl(path: string): Promise<string | null> {
  if (!path) return null;
  // If it's already a full URL (legacy), return as-is.
  if (/^https?:\/\//i.test(path)) return path;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60);
  if (error) {
    console.error("[fuel-logs] signed url failed", error);
    return null;
  }
  return data.signedUrl;
}

export interface CreateFuelLogInput {
  vehicleId: string;
  vehicleRegistration: string;
  driverId: string;
  driverEmail: string | null;
  liters: number;
  totalCost: number;
  notes?: string;
  mediaPath: string | null;
}

export async function createFuelLog(input: CreateFuelLogInput) {
  const { error, data } = await supabase
    .from("fuel_logs")
    .insert({
      vehicle_id: input.vehicleId,
      vehicle_registration: input.vehicleRegistration,
      driver_id: input.driverId,
      driver_email: input.driverEmail,
      liters: input.liters,
      total_cost: input.totalCost,
      notes: input.notes ?? null,
      media_url: input.mediaPath,
      status: "Pending",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchFuelLogs(status?: FuelLogStatus) {
  let q = supabase
    .from("fuel_logs")
    .select("*")
    .order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as FuelLogRow[];
}

export async function reviewFuelLog(params: {
  id: string;
  approve: boolean;
  reviewerId: string;
  note?: string;
}) {
  const { error } = await supabase
    .from("fuel_logs")
    .update({
      status: params.approve ? "Approved" : "Rejected",
      reviewed_by: params.reviewerId,
      reviewed_at: new Date().toISOString(),
      reviewer_note: params.note ?? null,
    })
    .eq("id", params.id);
  if (error) throw error;
}

export async function fetchApprovedFuelCostByVehicle(vehicleId: string) {
  const { data, error } = await supabase
    .from("fuel_logs")
    .select("total_cost")
    .eq("vehicle_id", vehicleId)
    .eq("status", "Approved");
  if (error) throw error;
  return (data ?? []).reduce((s, r) => s + Number(r.total_cost ?? 0), 0);
}
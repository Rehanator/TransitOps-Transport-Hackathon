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
  const { error, data } = await supabase.rpc("create_fuel_log", {
    _vehicle_id: input.vehicleId,
    _vehicle_registration: input.vehicleRegistration,
    _driver_id: input.driverId,
    _driver_email: input.driverEmail ?? undefined,
    _liters: input.liters,
    _total_cost: input.totalCost,
    _notes: input.notes ?? undefined,
    _media_url: input.mediaPath ?? undefined,
  });
  if (error) throw error;
  return data as unknown as FuelLogRow;
}

export async function fetchFuelLogs(status?: FuelLogStatus) {
  const { data, error } = await supabase.rpc("list_fuel_logs", {
    _status: status ?? undefined,
    _driver_id: undefined,
  });
  if (error) throw error;
  return (data ?? []) as FuelLogRow[];
}

export async function fetchFuelLogsByDriver(driverId: string, status?: FuelLogStatus) {
  const { data, error } = await supabase.rpc("list_fuel_logs", {
    _status: status ?? undefined,
    _driver_id: driverId,
  });
  if (error) throw error;
  return (data ?? []) as FuelLogRow[];
}

export async function reviewFuelLog(params: {
  id: string;
  approve: boolean;
  reviewerId: string;
  note?: string;
}) {
  const { error } = await supabase.rpc("review_fuel_log", {
    _id: params.id,
    _approve: params.approve,
    _reviewer_id: params.reviewerId,
    _note: params.note ?? undefined,
  });
  if (error) throw error;
}

export async function fetchApprovedFuelCostByVehicle(vehicleId: string) {
  const { data, error } = await supabase.rpc("sum_approved_fuel_cost", {
    _vehicle_id: vehicleId,
  });
  if (error) throw error;
  return Number(data ?? 0);
}
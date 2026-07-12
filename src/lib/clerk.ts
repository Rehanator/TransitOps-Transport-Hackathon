import { useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "Fleet Manager" | "Driver";

/**
 * Reads the current user's app role from Supabase `user_roles`,
 * keyed by Clerk user id (with email as a fallback so admins can pre-assign
 * a role before the user's first sign-in).
 */
export function useUserRole(): {
  role: AppRole | null;
  roles: AppRole[];
  isLoaded: boolean;
  isSignedIn: boolean;
} {
  const { isLoaded: clerkLoaded, isSignedIn, user } = useUser();
  const clerkId = user?.id ?? null;
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? null;

  const { data, isFetched, isLoading } = useQuery({
    queryKey: ["user_role", clerkId, email],
    enabled: !!clerkId,
    queryFn: async (): Promise<AppRole[]> => {
      if (!clerkId) return [];
      const { data, error } = await supabase.rpc("get_user_roles", {
        _clerk_user_id: clerkId,
        _email: email,
      });
      if (error) {
        console.error("[user_roles] fetch failed", error);
        return [];
      }
      const roles = new Set<AppRole>();
      for (const r of data ?? []) {
        if (r.role === "Fleet Manager" || r.role === "Driver") roles.add(r.role);
      }
      return Array.from(roles);
    },
  });

  const isLoaded = clerkLoaded && (!clerkId || isFetched || !isLoading);
  const roles = data ?? [];
  // Prefer Fleet Manager when the user has both roles.
  const role: AppRole | null = roles.includes("Fleet Manager")
    ? "Fleet Manager"
    : roles[0] ?? null;
  return { role, roles, isLoaded, isSignedIn: !!isSignedIn };
}

export function hasRole(role: AppRole | null, allowed: AppRole[]): boolean {
  return role !== null && allowed.includes(role);
}
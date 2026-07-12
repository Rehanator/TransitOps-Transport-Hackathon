import { useUser } from "@clerk/clerk-react";

export type AppRole = "Fleet Manager" | "Driver";

/**
 * Reads the current user's app role from Clerk `publicMetadata.role`.
 * Falls back to `null` until Clerk finishes loading or when unauthenticated.
 */
export function useUserRole(): {
  role: AppRole | null;
  isLoaded: boolean;
  isSignedIn: boolean;
} {
  const { isLoaded, isSignedIn, user } = useUser();
  const raw = user?.publicMetadata?.role;
  const role: AppRole | null =
    raw === "Fleet Manager" || raw === "Driver" ? raw : null;
  return { role, isLoaded, isSignedIn: !!isSignedIn };
}

export function hasRole(role: AppRole | null, allowed: AppRole[]): boolean {
  return role !== null && allowed.includes(role);
}
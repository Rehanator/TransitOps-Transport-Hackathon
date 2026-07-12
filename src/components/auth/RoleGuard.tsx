import type { ReactNode } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { useUserRole, type AppRole } from "@/lib/clerk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

interface Props {
  allowed: AppRole[];
  children: ReactNode;
}

export function RoleGuard({ allowed, children }: Props) {
  return (
    <>
      <SignedOut>
        <Card className="mx-auto mt-10 max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Sign in required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              You must sign in to access this page.
            </p>
            <SignInButton mode="modal">
              <Button>Sign in</Button>
            </SignInButton>
          </CardContent>
        </Card>
      </SignedOut>
      <SignedIn>
        <RoleGate allowed={allowed}>{children}</RoleGate>
      </SignedIn>
    </>
  );
}

function RoleGate({ allowed, children }: Props) {
  const { role, roles, isLoaded } = useUserRole();
  if (!isLoaded) {
    return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  }
  const hasAllowed = roles.some((r) => allowed.includes(r));
  if (!hasAllowed) {
    return (
      <Card className="mx-auto mt-10 max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            Access denied
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Your role{role ? ` (${role})` : ""} does not have access to this
            page.
          </p>
          <p>
            Required role: <strong>{allowed.join(" or ")}</strong>.
          </p>
          <p className="text-xs">
            Fleet Managers can assign roles from the admin console.
          </p>
        </CardContent>
      </Card>
    );
  }
  return <>{children}</>;
}
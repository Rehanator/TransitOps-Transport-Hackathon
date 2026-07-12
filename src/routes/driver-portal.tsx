import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck } from "lucide-react";

export const Route = createFileRoute("/driver-portal")({
  component: DriverPortal,
});

function DriverPortal() {
  return (
    <RoleGuard allowed={["Driver"]}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Truck className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Driver Portal</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Welcome, Driver</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              Submit trip logs, upload fuel receipts (photo/video proof), and
              view your assigned vehicles here.
            </p>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
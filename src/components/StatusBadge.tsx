import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  Available: "bg-success/15 text-success border-success/30",
  "On Trip": "bg-info/15 text-info border-info/30",
  "In Shop": "bg-warning/15 text-warning border-warning/30",
  Retired: "bg-muted text-muted-foreground border-border",
  "Off Duty": "bg-muted text-muted-foreground border-border",
  Suspended: "bg-destructive/15 text-destructive border-destructive/30",
  Draft: "bg-muted text-muted-foreground border-border",
  Dispatched: "bg-info/15 text-info border-info/30",
  Completed: "bg-success/15 text-success border-success/30",
  Cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  Open: "bg-warning/15 text-warning border-warning/30",
  Closed: "bg-success/15 text-success border-success/30",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", map[status] ?? "")}>
      {status}
    </Badge>
  );
}

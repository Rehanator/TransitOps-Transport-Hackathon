import { createFileRoute } from "@tanstack/react-router";
import { useStore, isLicenseExpired } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Truck,
  CheckCircle2,
  Wrench,
  Route as RouteIcon,
  Clock,
  Users,
  AlertTriangle,
  ShieldCheck,

} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function KpiCard({
  title, value, icon: Icon, hint, tone = "default",
}: {
  title: string; value: string | number; icon: typeof Truck; hint?: string;
  tone?: "default" | "success" | "warning" | "info" | "destructive";
}) {
  const toneMap = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    info: "bg-info/15 text-info",
    destructive: "bg-destructive/15 text-destructive",
  } as const;
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${toneMap[tone]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { vehicles, drivers, trips, maintenance, fuel, expenses, currentRole, users } = useStore();
  const [typeF, setTypeF] = useState<string>("all");
  const [statusF, setStatusF] = useState<string>("all");
  const [regionF, setRegionF] = useState<string>("all");

  const currentUser = users.find((u) => u.role === currentRole);
  const firstName = (currentUser?.name ?? currentRole).split(" ")[0];

  const roleSubtitle: Record<string, string> = {
    "Fleet Manager": "Operations overview for your fleet.",
    Driver: "Your active trips and assignments.",
    "Safety Officer": "License compliance and safety monitoring.",
    "Financial Analyst": "Costs, revenue, and fleet economics.",
  };

  const vFiltered = vehicles.filter(
    (v) =>
      (typeF === "all" || v.type === typeF) &&
      (statusF === "all" || v.status === statusF) &&
      (regionF === "all" || v.region === regionF),
  );

  const active = vFiltered.filter((v) => v.status === "On Trip").length;
  const available = vFiltered.filter((v) => v.status === "Available").length;
  const inShop = vFiltered.filter((v) => v.status === "In Shop").length;
  const activeTrips = trips.filter((t) => t.status === "Dispatched").length;
  const pendingTrips = trips.filter((t) => t.status === "Draft").length;
  const driversOnDuty = drivers.filter((d) => d.status === "On Trip").length;
  const utilizationPool = active + available;
  const utilization = utilizationPool ? Math.round((active / utilizationPool) * 100) : 0;
  const expiredLicenses = drivers.filter(isLicenseExpired).length;

  const regions = Array.from(new Set(vehicles.map((v) => v.region)));

  // charts
  const costByVehicle = vehicles.slice(0, 6).map((v) => {
    const f = fuel.filter((x) => x.vehicleId === v.id).reduce((s, x) => s + x.cost, 0);
    const m = maintenance.filter((x) => x.vehicleId === v.id).reduce((s, x) => s + x.cost, 0);
    const e = expenses.filter((x) => x.vehicleId === v.id).reduce((s, x) => s + x.cost, 0);
    return { name: v.regNumber.split("-").slice(-1)[0], Fuel: f, Maintenance: m, Expenses: e };
  });
  const statusPie = [
    { name: "Available", value: vehicles.filter((v) => v.status === "Available").length, color: "var(--color-chart-2)" },
    { name: "On Trip", value: vehicles.filter((v) => v.status === "On Trip").length, color: "var(--color-chart-1)" },
    { name: "In Shop", value: vehicles.filter((v) => v.status === "In Shop").length, color: "var(--color-chart-3)" },
    { name: "Retired", value: vehicles.filter((v) => v.status === "Retired").length, color: "var(--color-chart-4)" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back, {firstName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Signed in as {currentRole}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {roleSubtitle[currentRole] ?? "Operations overview for your fleet."}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={typeF} onValueChange={setTypeF}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Van">Van</SelectItem>
              <SelectItem value="Truck">Truck</SelectItem>
              <SelectItem value="Bus">Bus</SelectItem>
              <SelectItem value="Car">Car</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusF} onValueChange={setStatusF}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="On Trip">On Trip</SelectItem>
              <SelectItem value="In Shop">In Shop</SelectItem>
              <SelectItem value="Retired">Retired</SelectItem>
            </SelectContent>
          </Select>
          <Select value={regionF} onValueChange={setRegionF}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Region" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard title="Active Vehicles" value={active} icon={Truck} tone="info" />
        <KpiCard title="Available" value={available} icon={CheckCircle2} tone="success" />
        <KpiCard title="In Maintenance" value={inShop} icon={Wrench} tone="warning" />
        <KpiCard title="Active Trips" value={activeTrips} icon={RouteIcon} tone="info" />
        <KpiCard title="Pending Trips" value={pendingTrips} icon={Clock} />
        <KpiCard title="Drivers On Duty" value={driversOnDuty} icon={Users} tone="success" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fleet Utilization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-4xl font-bold">{utilization}%</span>
              <span className="text-sm text-muted-foreground">
                {active} of {utilizationPool} deployable vehicles on active trips
              </span>
            </div>
            <Progress value={utilization} className="h-3" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Fleet Status Mix</CardTitle></CardHeader>
          <CardContent className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusPie} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75}>
                  {statusPie.map((s) => <Cell key={s.name} fill={s.color} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-warning/40 bg-warning/5">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <CardTitle className="text-warning">License Alerts</CardTitle>
          {expiredLicenses > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {expiredLicenses} expired
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {expiredLicenses === 0 ? (
            <p className="text-sm text-muted-foreground">
              All driver licenses are currently valid.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {drivers.filter(isLicenseExpired).map((d) => (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm"
                >
                  <span className="font-medium">{d.name}</span>
                  <span className="text-muted-foreground">
                    license {d.licenseNumber} expired on {d.licenseExpiry}
                  </span>
                  <Badge variant="destructive" className="ml-auto">Expired</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>


      <Card>
        <CardHeader><CardTitle>Cost Distribution by Vehicle</CardTitle></CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costByVehicle}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="Fuel" stackId="a" fill="var(--color-chart-1)" />
              <Bar dataKey="Maintenance" stackId="a" fill="var(--color-chart-3)" />
              <Bar dataKey="Expenses" stackId="a" fill="var(--color-chart-4)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

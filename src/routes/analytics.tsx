import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/DataTable";
import { Download, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { exportCSV, exportPDF } from "@/lib/export";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/analytics")({ component: AnalyticsPage });

function AnalyticsPage() {
  const { vehicles, trips, fuel, maintenance, expenses } = useStore();

  const perVehicle = vehicles.map((v) => {
    const vFuel = fuel.filter((f) => f.vehicleId === v.id);
    const fuelCost = vFuel.reduce((s, f) => s + f.cost, 0);
    const litersTotal = vFuel.reduce((s, f) => s + f.liters, 0);
    const maintCost = maintenance.filter((m) => m.vehicleId === v.id).reduce((s, m) => s + m.cost, 0);
    const expCost = expenses.filter((e) => e.vehicleId === v.id).reduce((s, e) => s + e.cost, 0);
    const vTrips = trips.filter((t) => t.vehicleId === v.id && t.status === "Completed");
    const revenue = vTrips.reduce((s, t) => s + t.revenue, 0);
    const distance = vTrips.reduce((s, t) => s + (t.plannedDistance || 0), 0);
    const fuelEff = litersTotal > 0 ? distance / litersTotal : 0;
    const totalOpCost = fuelCost + maintCost + expCost;
    const roi = v.acquisitionCost > 0
      ? (revenue - (maintCost + fuelCost)) / v.acquisitionCost
      : 0;
    return {
      id: v.id, vehicle: v.regNumber, name: v.name,
      revenue, fuelCost, maintCost, expCost, totalOpCost,
      distance, litersTotal, fuelEff, roi,
    };
  });

  const totalRevenue = perVehicle.reduce((s, r) => s + r.revenue, 0);
  const totalCost = perVehicle.reduce((s, r) => s + r.totalOpCost, 0);
  const avgROI = perVehicle.length ? perVehicle.reduce((s, r) => s + r.roi, 0) / perVehicle.length : 0;

  const chartData = perVehicle.map((p) => ({
    name: p.vehicle.split("-").slice(-1)[0],
    Fuel: p.fuelCost, Maintenance: p.maintCost, Expenses: p.expCost, Revenue: p.revenue,
  }));

  const exportRows = perVehicle.map((p) => ({
    Vehicle: p.vehicle, Model: p.name,
    "Revenue (₹)": p.revenue, "Fuel Cost (₹)": p.fuelCost,
    "Maintenance Cost (₹)": p.maintCost, "Other Expenses (₹)": p.expCost,
    "Total Op Cost (₹)": p.totalOpCost, "Distance (km)": p.distance,
    "Fuel Efficiency (km/L)": p.fuelEff.toFixed(2),
    "ROI": p.roi.toFixed(3),
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Financial Analyst</p>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Reporting</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportCSV("financial-analytics.csv", exportRows)}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" onClick={() => exportPDF("Financial Analytics", exportRows)}>
            <FileText className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Revenue</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-success" />
            <span className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Operational Cost</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2">
            <TrendingDown className="h-6 w-6 text-destructive" />
            <span className="text-2xl font-bold">₹{totalCost.toLocaleString()}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Average ROI</CardTitle></CardHeader>
          <CardContent>
            <span className={`text-2xl font-bold ${avgROI >= 0 ? "text-success" : "text-destructive"}`}>
              {(avgROI * 100).toFixed(2)}%
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Cost vs Revenue by Vehicle</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="Fuel" stackId="cost" fill="var(--color-chart-1)" />
                <Bar dataKey="Maintenance" stackId="cost" fill="var(--color-chart-3)" />
                <Bar dataKey="Expenses" stackId="cost" fill="var(--color-chart-4)" />
                <Bar dataKey="Revenue" fill="var(--color-chart-2)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Fuel Efficiency (km/L)</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={perVehicle.map((p) => ({ name: p.vehicle.split("-").slice(-1)[0], efficiency: +p.fuelEff.toFixed(2) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="efficiency" stroke="var(--color-chart-2)" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Per-Vehicle Profitability</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            data={perVehicle}
            columns={[
              { key: "vehicle", header: "Vehicle", accessor: (r) => r.vehicle },
              { key: "revenue", header: "Revenue", accessor: (r) => r.revenue,
                render: (r) => `₹${r.revenue.toLocaleString()}` },
              { key: "fuelCost", header: "Fuel", accessor: (r) => r.fuelCost,
                render: (r) => `₹${r.fuelCost.toLocaleString()}` },
              { key: "maintCost", header: "Maintenance", accessor: (r) => r.maintCost,
                render: (r) => `₹${r.maintCost.toLocaleString()}` },
              { key: "expCost", header: "Other", accessor: (r) => r.expCost,
                render: (r) => `₹${r.expCost.toLocaleString()}` },
              { key: "totalOpCost", header: "Total Op Cost", accessor: (r) => r.totalOpCost,
                render: (r) => <span className="font-medium">₹{r.totalOpCost.toLocaleString()}</span> },
              { key: "fuelEff", header: "km/L", accessor: (r) => r.fuelEff,
                render: (r) => r.fuelEff ? r.fuelEff.toFixed(2) : "—" },
              { key: "roi", header: "ROI", accessor: (r) => r.roi,
                render: (r) => (
                  <span className={`font-semibold ${r.roi >= 0 ? "text-success" : "text-destructive"}`}>
                    {(r.roi * 100).toFixed(2)}%
                  </span>
                )},
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, type Expense } from "@/lib/store";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { exportCSV } from "@/lib/export";

export const Route = createFileRoute("/expenses")({ component: ExpensesPage });

function ExpensesPage() {
  const { expenses, vehicles, addExpense, deleteExpense, currentRole } = useStore();
  const canEdit = currentRole === "Fleet Manager" || currentRole === "Financial Analyst";
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Expense, "id">>({
    vehicleId: "", type: "Toll", cost: 500,
    date: new Date().toISOString().slice(0, 10),
  });

  const submit = () => {
    if (!form.vehicleId) return toast.error("Select vehicle");
    addExpense(form);
    toast.success("Expense added");
    setOpen(false);
  };

  const rows = expenses.map((e) => ({
    ID: e.id, Vehicle: vehicles.find((v) => v.id === e.vehicleId)?.regNumber ?? "-",
    Type: e.type, Cost: e.cost, Date: e.date,
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Overheads</p>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportCSV("expenses.csv", rows)}>
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
          {canEdit && (<Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> New</Button>)}
        </div>
      </header>

      <DataTable
        data={expenses}
        columns={[
          { key: "vehicle", header: "Vehicle",
            accessor: (r) => vehicles.find((v) => v.id === r.vehicleId)?.regNumber ?? "-" },
          { key: "type", header: "Type", accessor: (r) => r.type },
          { key: "cost", header: "Cost", accessor: (r) => r.cost,
            render: (r) => `₹${r.cost.toLocaleString()}` },
          { key: "date", header: "Date", accessor: (r) => r.date },
        ]}
        actions={(r) => (
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500"
            onClick={() => { deleteExpense(r.id); toast.success("Expense deleted"); }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record expense</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Vehicle</Label>
              <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.regNumber}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as Expense["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Toll","Fine","Miscellaneous"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Cost (₹)</Label>
                <Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: +e.target.value })} />
              </div>
              <div><Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

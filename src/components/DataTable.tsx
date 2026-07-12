import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Search } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  accessor?: (row: T) => string | number | undefined | null;
  sortable?: boolean;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchPlaceholder = "Search…",
  actions,
}: {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  actions?: (row: T) => React.ReactNode;
}) {
  const [q, setQ] = useState("");
  const [sorts, setSorts] = useState<{ key: string; dir: "asc" | "desc" }[]>([]);

  const filtered = useMemo(() => {
    const lower = q.toLowerCase();
    let rows = !lower
      ? data
      : data.filter((r) =>
          columns.some((c) => {
            const v = c.accessor ? c.accessor(r) : (r as Record<string, unknown>)[c.key];
            return String(v ?? "").toLowerCase().includes(lower);
          }),
        );
    if (sorts.length) {
      rows = [...rows].sort((a, b) => {
        for (const s of sorts) {
          const col = columns.find((c) => c.key === s.key);
          if (!col) continue;
          const av = col.accessor ? col.accessor(a) : (a as Record<string, unknown>)[s.key];
          const bv = col.accessor ? col.accessor(b) : (b as Record<string, unknown>)[s.key];
          const na = typeof av === "number" ? av : String(av ?? "");
          const nb = typeof bv === "number" ? bv : String(bv ?? "");
          if (na < nb) return s.dir === "asc" ? -1 : 1;
          if (na > nb) return s.dir === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return rows;
  }, [q, data, columns, sorts]);

  const toggleSort = (key: string, additive: boolean) => {
    setSorts((prev) => {
      const existing = prev.find((s) => s.key === key);
      let next = additive ? [...prev] : [];
      if (existing) {
        if (existing.dir === "asc") {
          next = next.map((s) => (s.key === key ? { ...s, dir: "desc" as const } : s));
        } else {
          next = next.filter((s) => s.key !== key);
        }
      } else {
        next.push({ key, dir: "asc" });
      }
      return additive ? next : next.slice(-1);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder={searchPlaceholder}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {sorts.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setSorts([])}>
            Clear sort
          </Button>
        )}
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => {
                const s = sorts.find((x) => x.key === c.key);
                return (
                  <TableHead key={c.key}>
                    {c.sortable === false ? (
                      c.header
                    ) : (
                      <button
                        onClick={(e) => toggleSort(c.key, e.shiftKey)}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        {c.header}
                        <ArrowUpDown className="h-3 w-3 opacity-60" />
                        {s && <span className="text-xs">{s.dir === "asc" ? "↑" : "↓"}</span>}
                      </button>
                    )}
                  </TableHead>
                );
              })}
              {actions && <TableHead className="w-1 text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="h-24 text-center text-muted-foreground"
                >
                  No records
                </TableCell>
              </TableRow>
            )}
            {filtered.map((row) => (
              <TableRow key={row.id}>
                {columns.map((c) => (
                  <TableCell key={c.key}>
                    {c.render
                      ? c.render(row)
                      : String((c.accessor ? c.accessor(row) : (row as Record<string, unknown>)[c.key]) ?? "")}
                  </TableCell>
                ))}
                {actions && <TableCell className="text-right">{actions(row)}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        {filtered.length} of {data.length} · Shift-click headers to sort by multiple columns.
      </p>
    </div>
  );
}

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Ruler, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listMeasurements } from "@/services/measurements";

function measurementEntryPath(g: {
  customerId: number;
  byGarment: Partial<Record<"Suit" | "Shirt" | "Pants", { id: number } | undefined>>;
}): string {
  const suit = g.byGarment.Suit;
  const shirt = g.byGarment.Shirt;
  const pants = g.byGarment.Pants;
  const first = suit ?? shirt ?? pants;
  if (first?.id) return `/measurements/${first.id}`;
  return `/measurements/new?customer_id=${g.customerId}`;
}

export default function MeasurementList() {
  const [search, setSearch] = useState("");

  const measurementsQuery = useQuery({
    queryKey: ["measurements", "list"],
    queryFn: () => listMeasurements(200),
  });

  const measurements = useMemo(() => measurementsQuery.data?.data ?? [], [measurementsQuery.data]);

  const groupedByCustomer = useMemo(() => {
    const map = new Map<
      number,
      {
        customerId: number;
        customerName: string;
        customerCode: string;
        latestUpdatedAt: string;
        byGarment: Partial<Record<"Suit" | "Shirt" | "Pants", (typeof measurements)[number]>>;
      }
    >();

    for (const m of measurements) {
      const customerId = m.customer_id;
      const existing = map.get(customerId);
      const customerName = m.customer?.name ?? "—";
      const customerCode = m.customer?.customer_code ?? "";
      const updatedAt = m.updated_at;

      const garment = m.garment_type as "Suit" | "Shirt" | "Pants";
      const byGarment = existing?.byGarment ?? {};
      const currentForGarment = byGarment[garment];
      if (!currentForGarment || Number(m.id) > Number(currentForGarment.id)) {
        byGarment[garment] = m;
      }

      map.set(customerId, {
        customerId,
        customerName,
        customerCode,
        latestUpdatedAt: existing ? (existing.latestUpdatedAt > updatedAt ? existing.latestUpdatedAt : updatedAt) : updatedAt,
        byGarment,
      });
    }

    return Array.from(map.values()).sort((a, b) => (a.latestUpdatedAt < b.latestUpdatedAt ? 1 : -1));
  }, [measurements]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groupedByCustomer;
    return groupedByCustomer.filter((g) => {
      return g.customerName.toLowerCase().includes(q) || (g.customerCode ? g.customerCode.toLowerCase().includes(q) : false);
    });
  }, [groupedByCustomer, search]);

  return (
    <div>
      <PageHeader
        title="Measurements"
        subtitle="Customer measurement records"
        actions={
          <Button asChild size="sm">
            <Link to="/measurements/new">
              <Plus className="h-4 w-4 mr-1" /> New
            </Link>
          </Button>
        }
      />

      <div className="bg-card rounded-xl card-shadow p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by customer name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {measurementsQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground flex items-center justify-between bg-card rounded-xl card-shadow p-5">
            <span>No measurements found</span>
            <Button asChild size="sm">
              <Link to="/measurements/new">
                <Plus className="h-4 w-4 mr-1" /> New
              </Link>
            </Button>
          </div>
        ) : (
          filtered.map((g) => (
            <Link
              key={g.customerId}
              to={measurementEntryPath(g)}
              className="block bg-card rounded-xl card-shadow p-5 transition-shadow hover:card-shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <Ruler className="h-4 w-4 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{g.customerName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {g.customerCode ? `${g.customerCode} · ` : ""}Updated {g.latestUpdatedAt ? format(new Date(g.latestUpdatedAt), "dd-MMM-yyyy") : "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(["Suit", "Shirt", "Pants"] as const).map((garment) => {
                  const hasMeasurement = !!g.byGarment[garment];
                  return (
                    <span
                      key={garment}
                      className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium border transition-colors ${
                        hasMeasurement
                          ? "bg-accent/10 text-accent-foreground border-accent/20"
                          : "bg-muted/30 text-muted-foreground border-transparent"
                      }`}
                    >
                      {garment}
                    </span>
                  );
                })}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

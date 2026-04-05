import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Pencil, Plus, Ruler, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listMeasurements } from "@/services/measurements";

export default function MeasurementList() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

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
            <div key={g.customerId} className="bg-card rounded-xl card-shadow p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <Ruler className="h-4 w-4 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{g.customerName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {g.customerCode ? `${g.customerCode} · ` : ""}Updated {g.latestUpdatedAt}
                    </p>
                  </div>
                </div>
              </div>

              <Tabs defaultValue={(g.byGarment.Suit ? "Suit" : g.byGarment.Shirt ? "Shirt" : g.byGarment.Pants ? "Pants" : "Suit")}>
                <TabsList className="mb-4">
                  {(["Suit", "Shirt", "Pants"] as const).map((garment) => {
                    const m = g.byGarment[garment];
                    const to = m
                      ? `/measurements/${m.id}`
                      : `/measurements/new?customer_id=${g.customerId}&garment_type=${encodeURIComponent(garment)}`;
                    const Icon = m ? Pencil : Plus;

                    return (
                      <TabsTrigger
                        key={garment}
                        value={garment}
                        className="flex-1 justify-between gap-2"
                        onClick={(e) => {
                          const el = e.target as HTMLElement | null;
                          if (!el) return;
                          if (el.closest("[data-action]")) {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(to);
                          }
                        }}
                      >
                        <span>{garment}</span>
                        <span
                          data-action
                          className="inline-flex items-center justify-center rounded-sm px-1.5 py-1 text-muted-foreground hover:text-foreground"
                          title={m ? "Edit" : "Add"}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {(["Suit", "Shirt", "Pants"] as const).map((garment) => {
                  const m = g.byGarment[garment];
                  return (
                    <TabsContent key={garment} value={garment}>
                      {m ? (
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-xs border border-border rounded-full px-2.5 py-0.5">{m.garment_type}</span>
                          {m.taker?.name ? (
                            <span className="text-xs border border-border rounded-full px-2.5 py-0.5">By {m.taker.name}</span>
                          ) : null}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No {garment} measurement yet</div>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

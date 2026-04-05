import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Ruler, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import { listMeasurements } from "@/services/measurements";

export default function MeasurementList() {
  const [search, setSearch] = useState("");

  const measurementsQuery = useQuery({
    queryKey: ["measurements", "list"],
    queryFn: () => listMeasurements(200),
  });

  const measurements = useMemo(() => measurementsQuery.data?.data ?? [], [measurementsQuery.data]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return measurements;
    return measurements.filter((m) => (m.customer?.name ?? "").toLowerCase().includes(q));
  }, [measurements, search]);

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
          filtered.map((m) => (
            <Link to={`/measurements/${m.id}`} key={m.id} className="bg-card rounded-xl card-shadow p-5 hover:card-shadow-hover transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Ruler className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{m.customer?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">Updated {m.updated_at}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs border border-border rounded-full px-2.5 py-0.5">{m.garment_type}</span>
                {m.taker?.name ? (
                  <span className="text-xs border border-border rounded-full px-2.5 py-0.5">By {m.taker.name}</span>
                ) : null}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

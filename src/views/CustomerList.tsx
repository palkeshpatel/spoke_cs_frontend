import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { LayoutGrid, List, Plus, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { listCustomers } from "@/services/customers";

export default function CustomerList() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("tm_customers_view") : null;
    if (saved === "grid" || saved === "list") setView(saved);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("tm_customers_view", view);
  }, [view]);

  const customersQuery = useQuery({
    queryKey: ["customers", "list"],
    queryFn: () => listCustomers(200),
  });

  const customers = useMemo(() => customersQuery.data?.data ?? [], [customersQuery.data]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const email = c.email ?? "";
      return c.name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || c.customer_code.toLowerCase().includes(q);
    });
  }, [customers, search]);

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} customers`}
        actions={
          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              value={view}
              onValueChange={(v) => {
                if (v === "grid" || v === "list") setView(v);
              }}
              variant="outline"
              size="sm"
              className="hidden sm:flex"
            >
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>

            <Button asChild size="sm">
              <Link to="/customers/new">
                <Plus className="h-4 w-4 mr-1" /> Add Customer
              </Link>
            </Button>
          </div>
        }
      />

      <div className="bg-card rounded-xl card-shadow">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        {view === "list" ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Customer Name</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Phone</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Email</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Total Orders</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Last Visit</th>
                </tr>
              </thead>
              <tbody>
                {customersQuery.isLoading ? (
                  <tr>
                    <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={5}>
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={5}>
                      No customers found
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/customers/${c.id}`} className="text-sm font-medium text-foreground hover:text-primary">
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{c.phone ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{c.email ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{c.orders_count ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{c.loyalty?.last_visit ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4">
            {customersQuery.isLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-muted-foreground">No customers found</div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((c) => (
                  <Link
                    to={`/customers/${c.id}`}
                    key={c.id}
                    className="bg-card rounded-xl card-shadow p-5 hover:card-shadow-hover transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-accent" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{c.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{c.customer_code}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs text-muted-foreground">Orders</div>
                        <div className="text-sm font-semibold">{c.orders_count ?? 0}</div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1">
                      <div className="text-xs text-muted-foreground truncate">{c.phone ?? "—"}</div>
                      <div className="text-xs text-muted-foreground truncate">{c.email ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">Last visit: {c.loyalty?.last_visit ?? "—"}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

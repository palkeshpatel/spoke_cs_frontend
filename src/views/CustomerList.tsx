import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Clock, Mail, Phone, Plus, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import { resolvePublicUrl } from "@/services/api";
import { listCustomers, type CustomerDto } from "@/services/customers";

function customerAvatarUrl(c: CustomerDto): string | null {
  return resolvePublicUrl(c.profile_image) ?? resolvePublicUrl(c.bodyImages?.[0]?.image_path ?? null);
}

export default function CustomerList() {
  const [search, setSearch] = useState("");

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

  const totalCustomers = customers.length;
  const activeThisMonth = useMemo(() => {
    const now = new Date();
    return customers.filter(c => {
      if (!c.loyalty?.last_visit) return false;
      const d = new Date(c.loyalty.last_visit);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [customers]);

  const newThisWeek = useMemo(() => {
    const nowTime = Date.now();
    return customers.filter(c => {
      if (!c.created_at) return false;
      return (nowTime - new Date(c.created_at).getTime()) <= 7 * 24 * 60 * 60 * 1000;
    }).length;
  }, [customers]);

  return (
    <div>
      <PageHeader
        title="Customer Profiles"
        subtitle="Manage customer database"
        actions={
          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link to="/customers/new">
                <Plus className="h-4 w-4 mr-1" /> Add Customer
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl card-shadow p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
            <User className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground font-medium">Total Customers</div>
            <div className="text-2xl font-bold">{totalCustomers}</div>
          </div>
        </div>
        
        <div className="bg-card rounded-xl card-shadow p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <User className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground font-medium">Active This Month</div>
            <div className="text-2xl font-bold">{activeThisMonth}</div>
          </div>
        </div>

        <div className="bg-card rounded-xl card-shadow p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground font-medium">New This Week</div>
            <div className="text-2xl font-bold">{newThisWeek}</div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl card-shadow">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
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
                  className="bg-card rounded-xl card-shadow p-5 border border-border/70 hover:card-shadow-hover hover:bg-muted/10 transition-[box-shadow,background-color]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {customerAvatarUrl(c) ? (
                          <img src={customerAvatarUrl(c)!} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-accent" />
                          </div>
                        )}
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

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                      <Phone className="h-3.5 w-3.5 shrink-0 opacity-80" />
                      <span className="truncate">{c.phone ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                      <Mail className="h-3.5 w-3.5 shrink-0 opacity-80" />
                      <span className="truncate">{c.email ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                      <Clock className="h-3.5 w-3.5 shrink-0 opacity-80" />
                      <span className="truncate">
                        Last visit: {c.loyalty?.last_visit ? format(new Date(c.loyalty.last_visit), "dd-MMM-yyyy") : "—"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

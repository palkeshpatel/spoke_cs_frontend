import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { LayoutGrid, List, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { listOrders } from "@/services/orders";

export default function OrderList() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");

  const ordersQuery = useQuery({
    queryKey: ["orders", "list"],
    queryFn: () => listOrders(200),
  });

  const orders = useMemo(() => ordersQuery.data?.data ?? [], [ordersQuery.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const orderNumber = (o.order_number ?? "").toLowerCase();
      const customerName = (o.customer?.name ?? "").toLowerCase();
      const orderType = (o.order_type ?? "").toLowerCase();
      return orderNumber.includes(q) || customerName.includes(q) || orderType.includes(q);
    });
  }, [orders, search]);

  const totalCount = ordersQuery.data?.total ?? orders.length;

  const getTotal = (order: (typeof orders)[number]) => {
    const items = order.items ?? [];
    return items.reduce((sum, it) => {
      const priceNum = typeof it.price === "string" ? Number(it.price) : Number(it.price);
      const qty = Number(it.quantity ?? 0);
      return sum + (Number.isFinite(priceNum) ? priceNum : 0) * (Number.isFinite(qty) ? qty : 0);
    }, 0);
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={`${totalCount} orders`}
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
              <Link to="/orders/new">
                <Plus className="h-4 w-4 mr-1" /> Add Order
              </Link>
            </Button>
          </div>
        }
      />

      <div className="bg-card rounded-xl card-shadow">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        {ordersQuery.isLoading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No orders found</div>
        ) : view === "list" ? (
          <div className="divide-y divide-border">
            {filtered.map((o) => {
              const total = getTotal(o);
              return (
                <Link
                  key={o.id}
                  to={`/orders/${o.id}`}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold">{o.order_number}</p>
                    <p className="text-sm text-muted-foreground">{o.customer?.name ?? "—"}</p>
                    <p className="text-sm text-primary">{o.order_type ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      Fabric: {o.fabric ?? "—"} · Delivery:{" "}
                      {o.delivery_date ? format(new Date(o.delivery_date), "dd-MMM-yyyy") : "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-row items-center justify-between gap-4 border-t border-border pt-3 sm:border-t-0 sm:pt-0 sm:text-right">
                    <StatusBadge status={o.status} />
                    <p className="text-sm font-semibold">${total.toFixed(2)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((o) => {
                const total = getTotal(o);
                return (
                  <Link
                    key={o.id}
                    to={`/orders/${o.id}`}
                    className="bg-card rounded-xl border border-border p-5 hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <p className="text-sm font-semibold">{o.order_number}</p>
                    <p className="text-sm text-muted-foreground truncate">{o.customer?.name ?? "—"}</p>
                    <p className="text-sm text-primary truncate mt-1">{o.order_type ?? "—"}</p>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">Fabric: {o.fabric ?? "—"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Delivery: {o.delivery_date ? format(new Date(o.delivery_date), "dd-MMM-yyyy") : "—"}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <StatusBadge status={o.status} />
                      <p className="text-sm font-semibold">${total.toFixed(2)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

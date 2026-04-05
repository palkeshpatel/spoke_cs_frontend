import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { listOrders } from "@/services/orders";

export default function OrderList() {
  const [search, setSearch] = useState("");

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
          <Button asChild size="sm">
            <Link to="/orders/new">
              <Plus className="h-4 w-4 mr-1" /> Add Order
            </Link>
          </Button>
        }
      />

      <div className="bg-card rounded-xl card-shadow">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Order #', 'Customer', 'Garment', 'Fabric', 'Delivery', 'Status', 'Total'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordersQuery.isLoading ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={7}>
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={7}>
                    No orders found
                  </td>
                </tr>
              ) : (
                filtered.map((o) => {
                  const total = getTotal(o);
                  return (
                    <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/orders/${o.id}`} className="text-sm font-medium hover:text-primary">
                          {o.order_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{o.customer?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{o.order_type ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{o.fabric ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{o.delivery_date ?? "—"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">${total.toFixed(2)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { LayoutGrid, List, Plus, Search, ChevronLeft, ChevronRight, FileText, Ruler, Scissors, PenTool, User, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { OrderStatusStepper } from "@/components/OrderStatusStepper";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { listOrders } from "@/services/orders";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function OrderList() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [view, setView] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  const { dateFrom, dateTo } = useMemo(() => {
    const now = new Date();
    let from: string | undefined;
    let to: string | undefined;
    if (dateRange === "today") {
      from = now.toISOString().split("T")[0];
      to = now.toISOString().split("T")[0];
    } else if (dateRange === "7days") {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      from = past.toISOString().split("T")[0];
      to = now.toISOString().split("T")[0];
    } else if (dateRange === "30days") {
      const past = new Date();
      past.setDate(now.getDate() - 30);
      from = past.toISOString().split("T")[0];
      to = now.toISOString().split("T")[0];
    }
    return { dateFrom: from, dateTo: to };
  }, [dateRange]);

  // Reset page to 1 when search or filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, dateRange]);

  const ordersQuery = useQuery({
    queryKey: ["orders", "list", page, debouncedSearch, status, dateRange],
    queryFn: () => listOrders(page, 10, undefined, debouncedSearch, status, dateFrom, dateTo),
  });

  const orders = useMemo(() => ordersQuery.data?.data ?? [], [ordersQuery.data]);
  
  // No longer filtering on the client, backend handles it
  const filtered = orders;

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
            <Button asChild size="sm" variant="outline">
              <Link to="/settings/customizations">
                Customisations
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/orders/new">
                <Plus className="h-4 w-4 mr-1" /> Add Order
              </Link>
            </Button>
          </div>
        }
      />

      <div className="bg-card rounded-xl card-shadow">
        <div className="flex overflow-x-auto border-b border-border hide-scrollbar">
          {[
            { id: "all", label: "All Orders", icon: FileText },
            { id: "measurement", label: "Measurement", icon: Ruler },
            { id: "cutting", label: "Cutting", icon: Scissors },
            { id: "stitching", label: "Stitching", icon: PenTool },
            { id: "trial_1", label: "Trial 1", icon: User },
            { id: "trial_2", label: "Trial 2", icon: UserCheck },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatus(tab.id)}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                status === tab.id
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by Order ID, Customer, Item..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="w-full sm:w-56 shrink-0">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Select Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
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
                  className="flex flex-col xl:flex-row xl:items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-[200px] shrink-0 space-y-1">
                    <p className="text-sm font-semibold">{o.order_number}</p>
                    <p className="text-sm text-muted-foreground truncate">{o.customer?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">Fabric: {o.fabric ?? "—"}</p>
                  </div>
                  
                  <div className="flex-1 w-full xl:w-auto px-2 xl:px-6">
                    <OrderStatusStepper status={o.status} isEditing={false} size="sm" />
                  </div>

                  <div className="flex shrink-0 items-center justify-between xl:justify-end gap-4 xl:w-[200px] pt-2 xl:pt-0 border-t border-border xl:border-t-0">
                    <StatusBadge status={o.status} />
                    <p className="text-sm font-semibold whitespace-nowrap">${total.toFixed(2)}</p>
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
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground line-clamp-1">Fabric: {o.fabric ?? "—"}</p>
                      <p className="text-sm font-semibold">${total.toFixed(2)}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <OrderStatusStepper status={o.status} isEditing={false} size="sm" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {ordersQuery.data && ordersQuery.data.total > 0 && (
          <div className="flex items-center justify-between px-4 py-4 border-t border-border sm:px-6 mt-4">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={page * 10 >= ordersQuery.data.total}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to <span className="font-medium">{Math.min(page * 10, ordersQuery.data.total)}</span> of <span className="font-medium">{ordersQuery.data.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px gap-2" aria-label="Pagination">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={page * 10 >= ordersQuery.data.total}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

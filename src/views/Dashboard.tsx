import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Clock, DollarSign, Package, TrendingUp, Users } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Link } from "react-router-dom";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getDashboard } from "@/services/dashboard";

export default function Dashboard() {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  const dashboard = dashboardQuery.data;
  const role = (dashboard?.role ?? "Staff").toLowerCase();
  const isAdmin = role === "admin";

  const stats = useMemo(() => {
    const s = dashboard?.stats;
    if (!s) return [];

    const base = [
      { label: "Total Customers", value: Number(s.total_customers ?? 0).toLocaleString(), icon: Users, color: "text-primary" },
      { label: "Total Orders", value: Number(s.total_orders ?? 0).toLocaleString(), icon: Package, color: "text-accent" },
      { label: "Pending Orders", value: Number(s.pending_orders ?? 0).toLocaleString(), icon: Clock, color: "text-warning" },
      { label: "Completed Orders", value: Number(s.completed_orders ?? 0).toLocaleString(), icon: CheckCircle, color: "text-success" },
    ];

    if (isAdmin) {
      base.push(
        {
          label: "Revenue This Month",
          value: `$${Number(s.revenue_this_month ?? 0).toLocaleString()}`,
          icon: DollarSign,
          color: "text-success",
        },
        {
          label: "Pending Revenue",
          value: `$${Number(s.pending_revenue ?? 0).toLocaleString()}`,
          icon: TrendingUp,
          color: "text-destructive",
        },
      );
    } else {
      base.push(
        { label: "Pending Payments", value: Number(s.pending_payments ?? 0).toLocaleString(), icon: TrendingUp, color: "text-destructive" },
        { label: "Role", value: dashboard?.role ?? "Staff", icon: Users, color: "text-primary" },
      );
    }

    return base;
  }, [dashboard?.role, dashboard?.stats, isAdmin]);

  const monthlyData = useMemo(() => {
    return (dashboard?.monthly_revenue ?? []).map((x) => ({ month: x.month, revenue: x.revenue }));
  }, [dashboard?.monthly_revenue]);

  const orderStatusData = useMemo(() => {
    const os = dashboard?.order_status ?? {};
    const colors: Record<string, string> = {
      pending: "hsl(38, 92%, 50%)",
      in_progress: "hsl(199, 89%, 48%)",
      trial: "hsl(258, 90%, 66%)",
      completed: "hsl(142, 76%, 36%)",
      delivered: "hsl(239, 84%, 67%)",
    };

    return Object.entries(os).map(([key, value]) => ({
      name: key.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()),
      value,
      color: colors[key] ?? "hsl(239, 84%, 67%)",
    }));
  }, [dashboard?.order_status]);

  const recentOrders = dashboard?.recent_orders ?? [];
  const todaysAppointments = dashboard?.todays_appointments ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
        {dashboardQuery.isLoading ? (
          <div className="col-span-2 sm:col-span-3 lg:col-span-6 bg-card rounded-xl card-shadow p-4 text-sm text-muted-foreground">
            Loading dashboard...
          </div>
        ) : null}
        {stats.map(s => (
          <div key={s.label} className="bg-card rounded-xl card-shadow p-3 sm:p-4">
            <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-lg sm:text-xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="bg-card rounded-xl card-shadow p-4 sm:p-5">
          <h3 className="text-base font-semibold mb-4">Monthly Revenue</h3>
          {isAdmin && monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
                <YAxis axisLine={false} tickLine={false} className="text-xs" />
                <Tooltip />
                <Bar dataKey="revenue" fill="hsl(239, 84%, 67%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
              {isAdmin ? "No revenue data" : "Admin only"}
            </div>
          )}
        </div>

        {/* Order Status */}
        <div className="bg-card rounded-xl card-shadow p-4 sm:p-5">
          <h3 className="text-base font-semibold mb-4">Order Status</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {orderStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {orderStatusData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Orders */}
        <div className="bg-card rounded-xl card-shadow p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">Recent Orders</h3>
            <Link to="/orders" className="text-xs text-primary font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {recentOrders.slice(0, 4).map(o => (
              <Link to={`/orders/${o.id}`} key={o.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{o.order_number}</p>
                  <p className="text-xs text-muted-foreground truncate">{o.customer?.name ?? '—'}</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <StatusBadge status={o.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-card rounded-xl card-shadow p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">Today's Appointments</h3>
            <Link to="/appointments" className="text-xs text-primary font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {todaysAppointments.map(a => (
              <Link to={`/appointments/${a.id}`} key={a.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{a.customer?.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.service_type} · {a.appointment_time ?? "—"} ({a.duration_minutes} min)</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <StatusBadge status={a.status} />
                  <p className={`text-xs font-bold mt-1 ${a.priority === "high" ? "text-destructive" : "text-primary"}`}>
                    {a.priority.toUpperCase()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

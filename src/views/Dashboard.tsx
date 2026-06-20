import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CalendarDays, Clock, DollarSign, Ruler, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { getDashboard } from "@/services/dashboard";
import { WorkTimer } from "@/components/WorkTimer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const IMG = {
  appointments: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=900&q=80",
  measurements: "https://images.unsplash.com/photo-1593030103066-0093718efeb9?auto=format&fit=crop&w=900&q=80",
  billing: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80",
  customers: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80",
  staff: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80",
  activity: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80",
} as const;

function formatMoney(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

type QuickTileProps = {
  to: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  icon: ReactNode;
  iconClass: string;
  leftLabel: string;
  leftValue: ReactNode;
  rightLabel: string;
  rightValue: ReactNode;
};

function QuickAccessTile({ to, title, description, image, imageAlt, icon, iconClass, leftLabel, leftValue, rightLabel, rightValue }: QuickTileProps) {
  return (
    <Link
      to={to}
      className="group block bg-card rounded-2xl card-shadow overflow-hidden border border-border/60 transition-shadow hover:card-shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
    >
      <div className="relative h-44 sm:h-48 overflow-hidden">
        <img src={image} alt={imageAlt} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
        <div
          className={cn(
            "absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-md",
            iconClass,
          )}
        >
          {icon}
        </div>
      </div>
      <div className="p-5 sm:p-6">
        <h3 className="text-lg font-bold text-foreground tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4">
          <div>
            <p className="text-xs text-muted-foreground">{leftLabel}</p>
            <p className="text-xl font-semibold text-foreground tabular-nums mt-0.5">{leftValue}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{rightLabel}</p>
            <p className="text-xl font-semibold text-foreground tabular-nums mt-0.5">{rightValue}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function dashboardErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
    return (err as { message: string }).message;
  }
  return "Could not load dashboard data.";
}

export default function Dashboard() {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const dashboard = dashboardQuery.data;
  const role = (dashboard?.role ?? "Staff").toLowerCase();
  const isAdmin = role === "admin";
  const s = dashboard?.stats;
  const todaysAppointments = dashboard?.todays_appointments ?? [];

  const summary = useMemo(() => {
    const todayAppts =
      s?.today_appointments_count !== undefined && s?.today_appointments_count !== null
        ? Number(s.today_appointments_count)
        : todaysAppointments.length;
    const pendingOrders = Number(s?.pending_orders ?? 0);
    const revenueMonth = isAdmin ? Number(s?.revenue_this_month ?? 0) : null;
    const overdue = Number(s?.billing_overdue_count ?? 0);
    const staffAlerts = Number(s?.pending_payments ?? 0);
    const totalOrders = Number(s?.total_orders ?? 0);

    return [
      {
        label: "Today's Appointments",
        value: String(todayAppts),
        icon: CalendarDays,
        iconWrap: "bg-sky-500",
      },
      {
        label: "Pending Orders",
        value: String(pendingOrders),
        icon: Clock,
        iconWrap: "bg-amber-500",
      },
      isAdmin
        ? {
          label: "This Month Revenue",
          value: formatMoney(revenueMonth ?? 0),
          icon: TrendingUp,
          iconWrap: "bg-emerald-500",
        }
        : {
          label: "Total Orders",
          value: String(totalOrders),
          icon: TrendingUp,
          iconWrap: "bg-emerald-500",
        },
      isAdmin
        ? {
          label: "Overdue Payments",
          value: String(overdue),
          icon: AlertCircle,
          iconWrap: "bg-red-500",
        }
        : {
          label: "Payment Follow-ups",
          value: String(staffAlerts),
          icon: AlertCircle,
          iconWrap: "bg-red-500",
        },
    ];
  }, [isAdmin, s, todaysAppointments.length]);

  const tiles = useMemo(() => {
    const todayAppts =
      s?.today_appointments_count !== undefined && s?.today_appointments_count !== null
        ? Number(s.today_appointments_count)
        : todaysAppointments.length;
    const upcoming = Number(s?.upcoming_appointments_count ?? 0);
    const mTotal = Number(s?.measurements_total ?? 0);
    const mRecent = Number(s?.measurements_recent_7d ?? 0);
    const pendingTotal = Number(s?.billing_pending_total ?? 0);
    const overdue = Number(s?.billing_overdue_count ?? 0);
    const customers = Number(s?.total_customers ?? 0);
    const newThisMonth = Number(s?.new_customers_this_month ?? 0);
    const totalStaff = Number(s?.total_staff ?? 0);
    const activeStaff = Number(s?.active_staff_sessions ?? 0);

    return {
      todayAppts,
      upcoming,
      mTotal,
      mRecent,
      pendingTotal,
      overdue,
      customers,
      newThisMonth,
      totalStaff,
      activeStaff,
    };
  }, [s, todaysAppointments.length]);

  const loadFailed = dashboardQuery.isError;
  const showData = !dashboardQuery.isPending && !loadFailed && dashboard != null;

  return (
    <div className="space-y-8">
      {loadFailed ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Dashboard could not be loaded</p>
              <p className="text-sm text-muted-foreground mt-1">{dashboardErrorMessage(dashboardQuery.error)}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Check that the API is running and <code className="rounded bg-muted px-1 py-0.5">VITE_API_BASE_URL</code> points to your backend
                (for example <code className="rounded bg-muted px-1 py-0.5">http://localhost:8000</code>).
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" className="shrink-0 self-start sm:self-center" onClick={() => void dashboardQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : null}

      {!isAdmin && (
        <div className="max-w-md">
          <WorkTimer />
        </div>
      )}



      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Access</h2>
        {dashboardQuery.isPending ? (
          <div className="grid grid-cols-2 md:grid-cols-2 gap-2 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[22rem] rounded-2xl bg-muted/80 animate-pulse border border-border/50" />
            ))}
          </div>
        ) : showData ? (
          <div className="grid grid-cols-2 md:grid-cols-2 gap-2 sm:gap-6">
            <QuickAccessTile
              to="/appointments"
              title="Appointments"
              description="Manage bookings & schedule"
              image={IMG.appointments}
              imageAlt="Scheduling and appointments"
              icon={<CalendarDays className="h-5 w-5" />}
              iconClass="bg-sky-600"
              leftLabel="Today"
              leftValue={tiles.todayAppts}
              rightLabel="Upcoming"
              rightValue={tiles.upcoming}
            />
            <QuickAccessTile
              to="/measurements"
              title="Measurements"
              description="Customer measurements"
              image={IMG.measurements}
              imageAlt="Tailoring and measurements"
              icon={<Ruler className="h-5 w-5" />}
              iconClass="bg-violet-600"
              leftLabel="Total"
              leftValue={tiles.mTotal}
              rightLabel="Recent"
              rightValue={tiles.mRecent}
            />
            <QuickAccessTile
              to="/billing"
              title="Billing"
              description="Invoices & payments"
              image={IMG.billing}
              imageAlt="Fabrics and tailoring"
              icon={<DollarSign className="h-5 w-5" />}
              iconClass="bg-emerald-600"
              leftLabel="Pending"
              leftValue={formatMoney(tiles.pendingTotal)}
              rightLabel="Overdue"
              rightValue={tiles.overdue}
            />
            <QuickAccessTile
              to="/customers"
              title="Customer Profiles"
              description="Customer database"
              image={IMG.customers}
              imageAlt="Tailored suit"
              icon={<Users className="h-5 w-5" />}
              iconClass="bg-orange-500"
              leftLabel="Total"
              leftValue={tiles.customers}
              rightLabel="New"
              rightValue={tiles.newThisMonth}
            />
            {isAdmin && (
              <>
                <QuickAccessTile
                  to="/staff"
                  title="Staff Management"
                  description="Manage team & roles"
                  image={IMG.staff}
                  imageAlt="Office team"
                  icon={<Users className="h-5 w-5" />}
                  iconClass="bg-indigo-600"
                  leftLabel="Total Staff"
                  leftValue={tiles.totalStaff}
                  rightLabel="Active"
                  rightValue={tiles.totalStaff > 0 ? tiles.totalStaff : 0}
                />
                <QuickAccessTile
                  to="/staff-monitoring"
                  title="Staff Activity Monitor"
                  description="Live activity tracking"
                  image={IMG.activity}
                  imageAlt="Activity monitor"
                  icon={<TrendingUp className="h-5 w-5" />}
                  iconClass="bg-rose-600"
                  leftLabel="Live"
                  leftValue={
                    <span className="flex items-center gap-1.5">
                      <span className={cn("h-2 w-2 rounded-full animate-pulse", tiles.activeStaff > 0 ? "bg-emerald-500" : "bg-muted-foreground/40")} />
                      {tiles.activeStaff}
                    </span>
                  }
                  rightLabel="Sessions"
                  rightValue={tiles.activeStaff}
                />
              </>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}

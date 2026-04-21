import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Bell,
  CalendarDays,
  Clock,
  DollarSign,
  HelpCircle,
  Ruler,
  Share2,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getDashboard } from "@/services/dashboard";
import { WorkTimer } from "@/components/WorkTimer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const IMG = {
  hero: "https://images.unsplash.com/photo-1558171813-3c29a3c0f55b?auto=format&fit=crop&w=1600&q=70",
  appointments: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=900&q=80",
  measurements: "https://images.unsplash.com/photo-1558171813-3c29a3c0f55b?auto=format&fit=crop&w=900&q=80",
  billing: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80",
  customers: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80",
  footer: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1600&q=60",
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
  leftValue: string | number;
  rightLabel: string;
  rightValue: string | number;
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

export default function Dashboard() {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  const dashboard = dashboardQuery.data;
  const role = (dashboard?.role ?? "Staff").toLowerCase();
  const isAdmin = role === "admin";
  const s = dashboard?.stats;
  const todaysAppointments = dashboard?.todays_appointments ?? [];

  const summary = useMemo(() => {
    const todayAppts = s?.today_appointments_count ?? todaysAppointments.length;
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
    const todayAppts = s?.today_appointments_count ?? todaysAppointments.length;
    const upcoming = Number(s?.upcoming_appointments_count ?? 0);
    const mTotal = Number(s?.measurements_total ?? 0);
    const mRecent = Number(s?.measurements_recent_7d ?? 0);
    const pendingTotal = Number(s?.billing_pending_total ?? 0);
    const overdue = Number(s?.billing_overdue_count ?? 0);
    const customers = Number(s?.total_customers ?? 0);
    const newThisMonth = Number(s?.new_customers_this_month ?? 0);

    return {
      todayAppts,
      upcoming,
      mTotal,
      mRecent,
      pendingTotal,
      overdue,
      customers,
      newThisMonth,
    };
  }, [s, todaysAppointments.length]);

  return (
    <div className="-mx-4 sm:-mx-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-none sm:rounded-2xl border border-border/60 bg-muted/30">
        <div className="absolute inset-0">
          <img src={IMG.hero} alt="" className="h-full w-full object-cover opacity-[0.22]" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/85 to-background" />
        </div>

        <div className="relative px-4 sm:px-8 pt-8 pb-6 sm:pt-10 sm:pb-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">SPOKE</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl">
                Professional Tailoring Management System
              </p>
            </div>

            <div className="w-full lg:max-w-md rounded-xl border border-border/80 bg-card/90 backdrop-blur-sm shadow-sm overflow-hidden">
              <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-zinc-900 text-zinc-100">
                <span className="text-xs font-medium truncate">Tailoring App Home Screen</span>
                <div className="flex items-center gap-1 shrink-0">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-100 hover:bg-white/10" aria-label="Notifications">
                    <Bell className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-100 hover:bg-white/10" aria-label="Help">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-zinc-100 hover:bg-white/10 gap-1">
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="px-4 sm:px-0 mt-6 space-y-8">
        {!isAdmin && (
          <div className="max-w-md">
            <WorkTimer />
          </div>
        )}

        {/* Welcome summary */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Welcome back</h2>
          {dashboardQuery.isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-muted/80 animate-pulse border border-border/50" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {summary.map((item) => (
                <div
                  key={item.label}
                  className="bg-card rounded-2xl border border-border/60 card-shadow p-4 sm:p-5 flex flex-col justify-between min-h-[7.5rem]"
                >
                  <div className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl text-white mb-3", item.iconWrap)}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground leading-snug">{item.label}</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums mt-1">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quick access */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick access</h2>
          {dashboardQuery.isLoading ? (
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[22rem] rounded-2xl bg-muted/80 animate-pulse border border-border/50" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
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
            </div>
          )}
        </section>

        {/* Footer banner */}
        <section className="relative overflow-hidden rounded-2xl border border-border/60 min-h-[11rem]">
          <img src={IMG.footer} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/90 to-background/75" />
          <div className="relative px-6 py-8 sm:px-10 sm:py-10 max-w-3xl">
            <p className="text-xl sm:text-2xl font-bold text-foreground">Crafting Excellence Since 2020</p>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed">
              Managing satisfied customers with precision and care. Your trusted partner in bespoke tailoring management.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

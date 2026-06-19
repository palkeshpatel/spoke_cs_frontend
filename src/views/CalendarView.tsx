"use client";

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, isValid, parseISO } from "date-fns";
import { Day } from "react-day-picker";
import { createContext, useContext } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import PageHeader from "@/components/PageHeader";
import { listAppointments } from "@/services/appointments";
import { listOrders } from "@/services/orders";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type CalendarEventType = "appointment" | "trial" | "delivery";

type CalendarEvent = {
  id: number;
  type: CalendarEventType;
  label: string;    // e.g. "09:40 · Emile" or "ORD-006 · John Smith"
  linkTo: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const normalized = s.replace(" ", "T");
  try {
    const d = parseISO(normalized.length === 10 ? `${normalized}T12:00:00` : normalized);
    if (!isValid(d)) return null;
    return format(d, "yyyy-MM-dd");
  } catch {
    return null;
  }
}

function truncLabel(name: string | undefined): string {
  if (!name?.trim()) return "—";
  const first = name.trim().split(/\s+/)[0] ?? name;
  return first.length > 13 ? `${first.slice(0, 12)}…` : first;
}

function timeHm(t: string | null | undefined): string {
  if (!t) return "—";
  const parts = t.split(":");
  return parts.length >= 2 ? parts.slice(0, 2).join(":") : t;
}

// ─── Context ─────────────────────────────────────────────────────────────────

type CalendarCtx = { byDate: Map<string, CalendarEvent[]> };
const UnifiedCalendarCtx = createContext<CalendarCtx | null>(null);

// ─── Day Cell ────────────────────────────────────────────────────────────────

const TAG_STYLES: Record<CalendarEventType, string> = {
  appointment:
    "bg-blue-500 sm:border sm:border-blue-200 sm:bg-gradient-to-r sm:from-blue-50 sm:to-blue-100 sm:text-blue-800 dark:sm:border-blue-800 dark:sm:from-blue-950 dark:sm:to-blue-900 dark:sm:text-blue-200",
  trial:
    "bg-amber-500 sm:border sm:border-amber-200 sm:bg-gradient-to-r sm:from-amber-50 sm:to-orange-100 sm:text-amber-800 dark:sm:border-amber-800 dark:sm:from-amber-950 dark:sm:to-orange-900 dark:sm:text-amber-200",
  delivery:
    "bg-emerald-500 sm:border sm:border-emerald-200 sm:bg-gradient-to-r sm:from-emerald-50 sm:to-green-100 sm:text-emerald-800 dark:sm:border-emerald-800 dark:sm:from-emerald-950 dark:sm:to-green-900 dark:sm:text-emerald-200",
};

type DayProps = React.ComponentProps<typeof Day>;

function UnifiedCalendarDayCell(props: DayProps) {
  const ctx = useContext(UnifiedCalendarCtx);
  const { day, className, style, children, ...rest } = props;

  const ymd = day.isoDate;
  const list = ctx?.byDate.get(ymd) ?? [];
  const maxShown = 4;

  return (
    <td
      className={cn("p-0.5 !h-auto min-h-[5.5rem] overflow-visible align-top", className)}
      style={style}
      {...rest}
    >
      <div
        className={cn(
          "relative flex min-h-[5rem] flex-col rounded-lg border border-border/60 bg-card",
          day.outside && "border-border/40 bg-muted/20 opacity-75",
          list.length > 0 && "max-sm:bg-primary/10 max-sm:border-primary/30"
        )}
      >
        <div className="flex shrink-0 items-start justify-end px-1 pt-1">{children}</div>

        {list.length > 0 ? (
          <>
            {/* Desktop View: Full List */}
            <div className="hidden sm:flex flex-col gap-1 px-1 pb-2 pt-0.5">
              {list.slice(0, maxShown).map((evt, i) => (
                <Link
                  key={`${evt.type}-${evt.id}-${i}`}
                  to={evt.linkTo}
                  className={cn(
                    "relative z-[1] block w-full max-w-full rounded-md px-2 py-1 text-left text-xs font-medium leading-snug shadow-sm",
                    "transition-all hover:scale-[1.02] hover:shadow-md",
                    TAG_STYLES[evt.type],
                  )}
                  title={evt.label}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  {evt.label}
                </Link>
              ))}
              {list.length > maxShown && (
                <span className="px-0.5 text-center text-[10px] font-medium text-muted-foreground">
                  +{list.length - maxShown} more
                </span>
              )}
            </div>

            {/* Mobile View: Absolute Overlay Trigger */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="sm:hidden absolute inset-0 w-full h-full rounded-lg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="View appointments"
                />
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2 space-y-1 z-50">
                {list.map((evt, i) => (
                  <Link
                    key={`mob-${evt.type}-${evt.id}-${i}`}
                    to={evt.linkTo}
                    className={cn(
                      "block w-full rounded-md px-2 py-2 text-left text-xs font-medium leading-snug shadow-sm",
                      "transition-all hover:bg-muted",
                      evt.type === "appointment" && "text-blue-800 bg-blue-50 border border-blue-200",
                      evt.type === "trial" && "text-amber-800 bg-amber-50 border border-amber-200",
                      evt.type === "delivery" && "text-emerald-800 bg-emerald-50 border border-emerald-200",
                    )}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    {evt.label}
                  </Link>
                ))}
              </PopoverContent>
            </Popover>
          </>
        ) : null}
      </div>
    </td>
  );
}

// ─── Main View ───────────────────────────────────────────────────────────────

export default function CalendarView() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const { data: apptData, isLoading: apptLoading } = useQuery({
    queryKey: ["appointments", "list"],
    queryFn: () => listAppointments(500),
  });

  const { data: orderData, isLoading: orderLoading } = useQuery({
    queryKey: ["orders", "list"],
    queryFn: () => listOrders(500),
  });

  const appointments = useMemo(() => apptData?.data ?? [], [apptData]);
  const orders = useMemo(() => orderData?.data ?? [], [orderData]);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();

    const push = (key: string, evt: CalendarEvent) => {
      const arr = map.get(key) ?? [];
      arr.push(evt);
      map.set(key, arr);
    };

    // Appointments
    for (const a of appointments) {
      const key = normalizeDate(a.appointment_date);
      if (!key) continue;
      push(key, {
        id: a.id,
        type: "appointment",
        label: `${timeHm(a.appointment_time)} · ${truncLabel(a.customer?.name)}`,
        linkTo: `/appointments/${a.id}`,
      });
    }

    // Orders — Trial Date
    for (const o of orders) {
      if (o.trial_date) {
        const key = normalizeDate(o.trial_date);
        if (key) {
          push(key, {
            id: o.id,
            type: "trial",
            label: `Trial · ${o.order_number} ${truncLabel(o.customer?.name)}`,
            linkTo: `/orders/${o.id}`,
          });
        }
      }
      // Orders — Delivery Date
      if (o.delivery_date) {
        const key = normalizeDate(o.delivery_date);
        if (key) {
          push(key, {
            id: o.id,
            type: "delivery",
            label: `Delivery · ${o.order_number} ${truncLabel(o.customer?.name)}`,
            linkTo: `/orders/${o.id}`,
          });
        }
      }
    }

    return map;
  }, [appointments, orders]);

  const isLoading = apptLoading || orderLoading;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Calendar"
        subtitle="All appointments, trial dates & delivery dates"
      />

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-blue-300 bg-blue-100 dark:border-blue-700 dark:bg-blue-900" />
          Appointment
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-amber-300 bg-amber-100 dark:border-amber-700 dark:bg-amber-900" />
          Trial Date
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-emerald-300 bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900" />
          Delivery Date
        </span>
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/15 p-3 shadow-sm sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading…"
              : `${appointments.length} appointments · ${orders.filter(o => o.trial_date || o.delivery_date).length} orders with dates`}
          </p>
        </div>

        <UnifiedCalendarCtx.Provider value={{ byDate }}>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="pointer-events-auto w-full max-w-full border-0 bg-transparent p-0 shadow-none [--rdp-day-width:100%] [--rdp-day-height:auto] [--rdp-day_button-width:auto] [--rdp-day_button-height:auto] [&_.rdp-day]:!h-auto [&_.rdp-day]:min-h-[5.5rem] [&_.rdp-day]:overflow-visible"
            components={{ Day: UnifiedCalendarDayCell }}
            classNames={{
              root: "relative w-full",
              months: "w-full",
              month: "relative w-full space-y-2",
              month_caption: "flex h-9 items-center justify-center",
              caption_label: "text-sm font-semibold text-foreground",
              nav: "absolute inset-x-0 top-0 z-[1] flex items-center justify-between px-1",
              button_previous:
                "relative h-8 w-8 rounded-md border border-border/60 bg-card text-foreground shadow-sm hover:bg-muted aria-disabled:opacity-40",
              button_next:
                "relative h-8 w-8 rounded-md border border-border/60 bg-card text-foreground shadow-sm hover:bg-muted aria-disabled:opacity-40",
              month_grid: "w-full table-fixed border-collapse",
              weekdays: "border-b border-border/40",
              weekday: "w-[14.28%] p-1 text-center text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground",
              day: "box-border !h-auto min-h-[5.5rem] w-[14.28%] overflow-visible align-top p-0.5",
              day_button:
                "mx-auto flex h-7 min-h-7 w-8 min-w-8 shrink-0 items-center justify-center rounded-md p-0 text-xs font-semibold text-muted-foreground hover:bg-muted/80 hover:text-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[selected-single=true]:shadow-sm",
            }}
          />
        </UnifiedCalendarCtx.Provider>

        <p className="mt-3 text-xs text-muted-foreground">
          Tap an event to open it. Blue = Appointment · Amber = Trial Date · Green = Delivery Date
        </p>
      </div>
    </div>
  );
}

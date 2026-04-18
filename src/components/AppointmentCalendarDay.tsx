"use client";

import * as React from "react";
import { createContext, useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import { format, isValid, parseISO } from "date-fns";
import { Day } from "react-day-picker";

import { cn } from "@/lib/utils";
import type { AppointmentDto } from "@/services/appointments";

/** API may send `YYYY-MM-DD`, ISO datetime, or `YYYY-MM-DD HH:mm:ss`. */
export function normalizeAppointmentDateKey(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) {
    const head = s.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(head)) return head;
  }
  const normalized = s.replace(" ", "T").replace(/\.\d{3}Z?$/, "");
  try {
    const d = parseISO(normalized.length === 10 ? `${normalized}T12:00:00` : normalized);
    if (!isValid(d)) return null;
    return format(d, "yyyy-MM-dd");
  } catch {
    return null;
  }
}

export function buildAppointmentsByDateMap(rows: AppointmentDto[]): Map<string, AppointmentDto[]> {
  const m = new Map<string, AppointmentDto[]>();
  for (const a of rows) {
    const key = normalizeAppointmentDateKey(a.appointment_date);
    if (!key) continue;
    const arr = m.get(key) ?? [];
    arr.push(a);
    m.set(key, arr);
  }
  for (const arr of m.values()) {
    arr.sort((x, y) => String(x.appointment_time ?? "").localeCompare(String(y.appointment_time ?? "")));
  }
  return m;
}

function formatApptTime(t: string | null | undefined): string {
  if (!t) return "—";
  const parts = t.split(":");
  if (parts.length >= 2) return parts.slice(0, 3).join(":");
  return t;
}

type CalendarCtx = {
  byDate: Map<string, AppointmentDto[]>;
};

const AppointmentCalendarCtx = createContext<CalendarCtx | null>(null);

export function AppointmentCalendarProvider({
  appointments,
  children,
}: {
  appointments: AppointmentDto[];
  children: React.ReactNode;
}) {
  const byDate = useMemo(() => buildAppointmentsByDateMap(appointments), [appointments]);
  const value = useMemo(() => ({ byDate }), [byDate]);
  return <AppointmentCalendarCtx.Provider value={value}>{children}</AppointmentCalendarCtx.Provider>;
}

type DayProps = React.ComponentProps<typeof Day>;

function customerCalendarLabel(name: string | undefined): string {
  if (!name?.trim()) return "—";
  const first = name.trim().split(/\s+/)[0] ?? name;
  return first.length > 14 ? `${first.slice(0, 13)}…` : first;
}

function timeHm(t: string | null | undefined): string {
  const s = formatApptTime(t);
  if (s === "—") return s;
  return s.length >= 5 ? s.slice(0, 5) : s;
}

/**
 * Custom calendar cell: day number + appointment links.
 * react-day-picker default `.rdp-day { height: 44px }` clips content — parent passes `!h-auto` on `day` classNames.
 */
export function AppointmentCalendarDayCell(props: DayProps) {
  const ctx = useContext(AppointmentCalendarCtx);
  const { day, className, style, children, ...rest } = props;

  const ymd = day.isoDate;
  const list = ctx?.byDate.get(ymd) ?? [];
  const maxShown = 5;

  return (
    <td
      className={cn("p-0.5 !h-auto min-h-[5.5rem] overflow-visible align-top", className)}
      style={style}
      {...rest}
    >
      <div
        className={cn(
          "flex min-h-[5rem] flex-col rounded-lg border border-border/60 bg-card",
          day.outside && "border-border/40 bg-muted/20 opacity-75",
        )}
      >
        <div className="flex shrink-0 items-start justify-end px-1 pt-1">{children}</div>

        {list.length > 0 ? (
          <div className="flex flex-col gap-1 px-1 pb-2 pt-0.5">
            {list.slice(0, maxShown).map((a) => (
              <Link
                key={a.id}
                to={`/appointments/${a.id}`}
                className={cn(
                  "relative z-[1] block w-full max-w-full rounded-md border border-primary/30 bg-primary px-2 py-1 text-left text-xs font-medium leading-snug text-primary-foreground shadow-sm",
                  "transition-opacity hover:opacity-90",
                )}
                title={`${a.customer?.name ?? "Customer"} — ${a.service_type}`}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <span className="font-semibold tabular-nums">{timeHm(a.appointment_time)}</span>
                <span className="mx-1 opacity-90">·</span>
                <span>{customerCalendarLabel(a.customer?.name)}</span>
              </Link>
            ))}
            {list.length > maxShown ? (
              <span className="px-0.5 text-center text-[10px] font-medium text-muted-foreground">+{list.length - maxShown} more</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </td>
  );
}

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Clock, Download, LayoutGrid, List, Users } from "lucide-react";
import { getWorkReport, type WorkReportStaffGroup } from "@/services/staff";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function WorkReports() {
  const [dates, setDates] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [view, setView] = useState<"list" | "grid">("list");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["work-report", dates],
    queryFn: () => getWorkReport(dates.start, dates.end),
  });

  const report = data?.report ?? [];
  const totals = useMemo(() => {
    return report.reduce(
      (acc, group) => {
        acc.staff += 1;
        acc.sessions += group.total_sessions;
        acc.work += group.total_work_minutes;
        acc.breaks += group.total_break_minutes;
        return acc;
      },
      { staff: 0, sessions: 0, work: 0, breaks: 0 },
    );
  }, [report]);

  const formatClockTime = (value?: string | null) => {
    if (!value) return "Running";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "—";
    return dt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatMinutes = (minutes: number) => {
    const totalSeconds = Math.max(0, Math.round((Number.isFinite(minutes) ? minutes : 0) * 60));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  };

  const getDurationFromRange = (start?: string | null, end?: string | null) => {
    if (!start || !end) return null;
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) return null;
    const seconds = Math.floor((endMs - startMs) / 1000);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  };

  const formatBreakLabel = (breakType: WorkReportStaffGroup["sessions"][number]["breaks"][number]["break_type"]) => {
    if (breakType === "tea") return "Tea";
    if (breakType === "lunch") return "Lunch";
    if (breakType === "personal") return "Personal";
    return "Other";
  };

  const formatSessionTimeRange = (session: WorkReportStaffGroup["sessions"][number] | undefined) => {
    if (!session?.start_time) return "—";
    const start = formatClockTime(session.start_time);
    const end = formatClockTime(session.end_time);
    return `${start} -> ${end}`;
  };

  const handleExportCSV = () => {
    if (report.length === 0) return;

    const csvSafe = (value: unknown) => {
      const text = String(value ?? "");
      const escaped = text.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const headers = ["Staff", "Role", "Date", "Start", "End", "Work Minutes", "Break Minutes", "Break Details", "Status"];
    const rows = report.flatMap((group) =>
      group.sessions.map((session) => [
        group.staff?.name ?? "-",
        group.staff?.role?.role_name ?? "Staff",
        session.work_date,
        formatClockTime(session.start_time),
        formatClockTime(session.end_time),
        session.total_work_minutes,
        session.total_break_minutes,
        session.breaks.length
          ? session.breaks
              .map((b) => `${formatBreakLabel(b.break_type)} ${b.break_minutes}m`)
              .join(" | ")
          : "-",
        session.status,
      ]),
    );

    const csvContent = [headers, ...rows]
      .map((row) => row.map(csvSafe).join(","))
      .join("\r\n");

    // BOM helps Excel on Windows detect UTF-8 correctly.
    const blob = new Blob(["\uFEFF", csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `work_report_${dates.start}_to_${dates.end}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Work & Attendance Reports"
        subtitle="Analyze staff working hours and attendance history."
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
            <Button onClick={handleExportCSV} disabled={report.length === 0} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>
        }
      />

      <div className="bg-card rounded-xl card-shadow border p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2.5 py-1">Users: {totals.staff}</span>
          <span className="rounded-full bg-muted px-2.5 py-1">Sessions: {totals.sessions}</span>
          <span className="rounded-full bg-muted px-2.5 py-1">Work: {formatMinutes(totals.work)}</span>
          <span className="rounded-full bg-muted px-2.5 py-1">Break: {formatMinutes(totals.breaks)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1.5 min-w-[150px]">
            <label className="text-xs font-medium text-muted-foreground">Start Date</label>
            <input 
              type="date" 
              value={dates.start} 
              onChange={e => setDates(prev => ({ ...prev, start: e.target.value }))}
              className="bg-background border rounded-md px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5 min-w-[150px]">
            <label className="text-xs font-medium text-muted-foreground">End Date</label>
            <input 
              type="date" 
              value={dates.end} 
              onChange={e => setDates(prev => ({ ...prev, end: e.target.value }))}
              className="bg-background border rounded-md px-3 py-1.5 text-sm"
            />
          </div>
          <Button onClick={() => refetch()} className="mt-5">Filter</Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card card-shadow">
        {isLoading ? (
          <div className="px-4 py-10 text-center text-muted-foreground">Loading report data...</div>
        ) : report.length === 0 ? (
          <div className="px-4 py-10 text-center text-muted-foreground">No data found for selected range.</div>
        ) : view === "list" ? (
          <div className="divide-y divide-border">
            {report.map((group) => {
              const staffName = group.staff?.name ?? "Unknown staff";
              const roleName = group.staff?.role?.role_name ?? "Staff";
              const latestSession = group.sessions[0];

              return (
                <div key={group.staff_id ?? staffName} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                          <Users className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{staffName}</p>
                          <p className="text-sm text-muted-foreground truncate">{roleName}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Latest: {latestSession ? format(new Date(latestSession.work_date), "dd-MMM-yyyy") : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatSessionTimeRange(latestSession)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border pt-3 sm:border-t-0 sm:pt-0">
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs">Sessions: {group.total_sessions}</span>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs">Work: {formatMinutes(group.total_work_minutes)}</span>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs">Break: {formatMinutes(group.total_break_minutes)}</span>
                      <StatusBadge status={latestSession?.status ?? "completed"} />
                    </div>
                  </div>

                  <Collapsible className="mt-4 rounded-xl border border-border/70 bg-muted/20 px-3 sm:px-4">
                    <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 py-3 text-left">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Session & Break Breakdown</p>
                        <p className="text-xs text-muted-foreground">{group.sessions.length} session(s) - click to expand</p>
                      </div>
                      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pb-3">
                      <div className="space-y-3">
                        {group.sessions.map((session) => {
                          const sessionDuration = getDurationFromRange(session.start_time, session.end_time) ?? formatMinutes(session.total_work_minutes);
                          return (
                            <div key={session.id} className="rounded-xl border border-border/70 bg-background p-3">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium">{format(new Date(session.work_date), "dd-MMM-yyyy")}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Time: {formatClockTime(session.start_time)}{" -> "}{formatClockTime(session.end_time)}
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs">Session: {sessionDuration}</span>
                                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs">Break total: {formatMinutes(session.total_break_minutes)}</span>
                                  <StatusBadge status={session.status} />
                                </div>
                              </div>

                              <div className="mt-3 space-y-2">
                                {session.breaks.length === 0 ? (
                                  <p className="text-xs text-muted-foreground">No breaks recorded.</p>
                                ) : (
                                  session.breaks.map((brk) => {
                                    const breakDuration = getDurationFromRange(brk.break_start, brk.break_end) ?? formatMinutes(brk.break_minutes);
                                    return (
                                      <div key={brk.id} className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs">
                                        <p className="font-medium">{formatBreakLabel(brk.break_type)} break</p>
                                        <p className="text-muted-foreground">
                                          {formatClockTime(brk.break_start)}{" -> "}{formatClockTime(brk.break_end)}
                                        </p>
                                        <p className="text-muted-foreground">Duration: {breakDuration}</p>
                                        {brk.remarks ? <p className="text-muted-foreground">Note: {brk.remarks}</p> : null}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {report.map((group) => {
                const staffName = group.staff?.name ?? "Unknown staff";
                const roleName = group.staff?.role?.role_name ?? "Staff";
                const latestSession = group.sessions[0];

                return (
                  <div key={group.staff_id ?? staffName} className="bg-card rounded-xl border border-border p-5 hover:bg-muted/40 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{staffName}</p>
                        <p className="text-sm text-muted-foreground truncate">{roleName}</p>
                      </div>
                      <StatusBadge status={latestSession?.status ?? "completed"} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {latestSession ? format(new Date(latestSession.work_date), "dd-MMM-yyyy") : "—"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatSessionTimeRange(latestSession)}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-muted/30 px-3 py-2">
                        <p className="text-muted-foreground">Sessions</p>
                        <p className="font-semibold">{group.total_sessions}</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 px-3 py-2">
                        <p className="text-muted-foreground">Work</p>
                        <p className="font-semibold">{formatMinutes(group.total_work_minutes)}</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 px-3 py-2 col-span-2">
                        <p className="text-muted-foreground">Break</p>
                        <p className="font-semibold">{formatMinutes(group.total_break_minutes)}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(latestSession?.breaks ?? []).length > 0 ? (
                        latestSession.breaks.map((brk) => (
                          <span key={brk.id} className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] text-primary">
                            {formatBreakLabel(brk.break_type)} {getDurationFromRange(brk.break_start, brk.break_end) ?? formatMinutes(brk.break_minutes)}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">No breaks</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

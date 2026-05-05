import { useEffect, useMemo, useState } from "react";
import { Play, Pause, StopCircle, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStaffWorkStatus, startStaffWork, pauseStaffWork, resumeStaffWork, completeStaffWork } from "@/services/staff";
import { Button } from "@/components/ui/button";

export function WorkTimer() {
  const queryClient = useQueryClient();
  const { data: statusData, isLoading } = useQuery({
    queryKey: ["staff-work-status"],
    queryFn: getStaffWorkStatus,
  });

  const [nowMs, setNowMs] = useState(Date.now());
  const [breakType, setBreakType] = useState<"tea" | "lunch" | "personal" | "other">("other");
  const session = statusData?.session;
  const todaySessions = statusData?.today_sessions ?? [];

  useEffect(() => {
    if (!session || session.status === "completed") return;
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [session]);

  const openBreakSeconds = useMemo(() => {
    if (!session || session.status !== "on_break") return 0;
    const fullSession = todaySessions.find((s) => s.id === session.id);
    const openBreak = fullSession?.breaks?.find((b) => !b.break_end);
    if (!openBreak) return 0;
    return Math.max(0, Math.floor((nowMs - new Date(openBreak.break_start).getTime()) / 1000));
  }, [session, todaySessions, nowMs]);

  const netElapsedSeconds = useMemo(() => {
    if (!session) return 0;
    const startMs = new Date(session.start_time).getTime();
    const endMs = session.end_time ? new Date(session.end_time).getTime() : nowMs;
    const grossSeconds = Math.max(0, Math.floor((endMs - startMs) / 1000));
    const closedBreakSeconds = Math.max(0, session.total_break_minutes * 60);
    return Math.max(0, grossSeconds - closedBreakSeconds - openBreakSeconds);
  }, [session, nowMs, openBreakSeconds]);

  const totalBreakMinutesLive = useMemo(() => {
    if (!session) return 0;
    return Math.floor((session.total_break_minutes * 60 + openBreakSeconds) / 60);
  }, [session, openBreakSeconds]);

  const refreshWorkQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["staff-work-status"] });
    queryClient.invalidateQueries({ queryKey: ["active-staff"] });
    queryClient.invalidateQueries({ queryKey: ["work-report"] });
  };

  const startMutation = useMutation({
    mutationFn: startStaffWork,
    onSuccess: refreshWorkQueries,
  });

  const pauseMutation = useMutation({
    mutationFn: pauseStaffWork,
    onSuccess: refreshWorkQueries,
  });

  const resumeMutation = useMutation({
    mutationFn: resumeStaffWork,
    onSuccess: refreshWorkQueries,
  });

  const completeMutation = useMutation({
    mutationFn: completeStaffWork,
    onSuccess: refreshWorkQueries,
  });

  if (isLoading) return <div className="text-xs text-muted-foreground">Loading status...</div>;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const statusLabel = session?.status === "active"
    ? "Active"
    : session?.status === "on_break"
      ? "On Break"
      : "Not Started";

  const isAnyMutationPending = startMutation.isPending || pauseMutation.isPending || resumeMutation.isPending || completeMutation.isPending;

  return (
    <div className="bg-card rounded-xl border p-4 flex flex-col gap-3">
      <div className="flex flex-col items-center gap-1 text-primary">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          <span className="text-xl font-mono font-bold">{statusLabel}</span>
        </div>
        {session && <span className="text-xs text-muted-foreground">Net work: {formatTime(netElapsedSeconds)}</span>}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {!session && (
          <Button onClick={() => startMutation.mutate()} disabled={isAnyMutationPending} className="bg-success hover:bg-success/90">
            <Play className="w-4 h-4 mr-2" /> Start Work
          </Button>
        )}

        {session?.status === "active" && (
          <>
            <select
              value={breakType}
              onChange={(e) => setBreakType(e.target.value as "tea" | "lunch" | "personal" | "other")}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              disabled={isAnyMutationPending}
            >
              <option value="tea">Tea Break</option>
              <option value="lunch">Lunch Break</option>
              <option value="personal">Personal Break</option>
              <option value="other">Other Break</option>
            </select>
            <Button onClick={() => pauseMutation.mutate({ break_type: breakType })} disabled={isAnyMutationPending} variant="secondary">
              <Pause className="w-4 h-4 mr-2" /> Start Break
            </Button>
            <Button
              onClick={() => {
                if (confirm("Finish this work session?")) completeMutation.mutate();
              }}
              disabled={isAnyMutationPending}
              variant="destructive"
            >
              <StopCircle className="w-4 h-4 mr-2" /> End Work
            </Button>
          </>
        )}

        {session?.status === "on_break" && (
          <>
            <Button onClick={() => resumeMutation.mutate()} disabled={isAnyMutationPending} className="bg-accent hover:bg-accent/90">
              <Play className="w-4 h-4 mr-2" /> End Break
            </Button>
            <Button
              onClick={() => {
                if (confirm("Finish this work session?")) completeMutation.mutate();
              }}
              disabled={isAnyMutationPending}
              variant="destructive"
            >
              <StopCircle className="w-4 h-4 mr-2" /> End Work
            </Button>
          </>
        )}
      </div>

      {session && (
        <p className="text-xs text-center text-muted-foreground">Total break: {totalBreakMinutesLive} mins</p>
      )}

      {todaySessions.length > 0 && (
        <div className="border-t pt-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Today's Entries</p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {todaySessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1 text-xs">
                <span>
                  {new Date(s.start_time).toLocaleTimeString()} - {s.end_time ? new Date(s.end_time).toLocaleTimeString() : "Running"}
                </span>
                <span className="text-muted-foreground">
                  {s.status === "completed" ? `${s.total_work_minutes}m` : s.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

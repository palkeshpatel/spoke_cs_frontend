import { useState, useEffect } from "react";
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

  const [elapsed, setElapsed] = useState(0);
  const session = statusData?.session;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (session && (session.status === 'started' || session.status === 'resumed')) {
      const startTime = new Date(session.resume_time || session.start_time).getTime();
      // This is a simplification, real elapsed should account for multiple pauses
      // For UI display, we'll just show time since last start/resume + previous total
      // But for now let's just show a simple indicator
      interval = setInterval(() => {
        const now = new Date().getTime();
        const diff = Math.floor((now - startTime) / 1000);
        setElapsed(diff);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [session]);

  const startMutation = useMutation({
    mutationFn: startStaffWork,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff-work-status"] }),
  });

  const pauseMutation = useMutation({
    mutationFn: pauseStaffWork,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff-work-status"] }),
  });

  const resumeMutation = useMutation({
    mutationFn: resumeStaffWork,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff-work-status"] }),
  });

  const completeMutation = useMutation({
    mutationFn: completeStaffWork,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff-work-status"] }),
  });

  if (isLoading) return <div className="text-xs text-muted-foreground">Loading status...</div>;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-card rounded-xl border p-4 flex flex-col items-center gap-3">
      <div className="flex items-center gap-2 text-primary">
        <Clock className="w-5 h-5" />
        <span className="text-xl font-mono font-bold">
          {session && (session.status === 'started' || session.status === 'resumed') ? "Active" : session?.status === 'paused' ? "Paused" : "Not Started"}
        </span>
      </div>

      <div className="flex gap-2">
        {!session && (
          <Button onClick={() => startMutation.mutate()} disabled={startMutation.isPending} className="bg-success hover:bg-success/90">
            <Play className="w-4 h-4 mr-2" /> Start Work
          </Button>
        )}

        {session && (session.status === 'started' || session.status === 'resumed') && (
          <Button onClick={() => pauseMutation.mutate()} disabled={pauseMutation.isPending} variant="secondary">
            <Pause className="w-4 h-4 mr-2" /> Take Break
          </Button>
        )}

        {session && session.status === 'paused' && (
          <Button onClick={() => resumeMutation.mutate()} disabled={resumeMutation.isPending} className="bg-accent hover:bg-accent/90">
            <Play className="w-4 h-4 mr-2" /> Resume Work
          </Button>
        )}

        {session && (
          <Button onClick={() => {
            if(confirm("Complete shift for today?")) completeMutation.mutate();
          }} disabled={completeMutation.isPending} variant="destructive">
            <StopCircle className="w-4 h-4 mr-2" /> Finish Shift
          </Button>
        )}
      </div>
      
      {session && session.total_break_minutes > 0 && (
        <p className="text-xs text-muted-foreground">Total break: {session.total_break_minutes} mins</p>
      )}
    </div>
  );
}

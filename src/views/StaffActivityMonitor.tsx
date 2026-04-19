import { useQuery } from "@tanstack/react-query";
import { Users, Clock, Coffee, CheckCircle } from "lucide-react";
import { getActiveStaff } from "@/services/staff";
import { StatusBadge } from "@/components/StatusBadge";

export default function StaffActivityMonitor() {
  const { data, isLoading } = useQuery({
    queryKey: ["active-staff"],
    queryFn: getActiveStaff,
    refetchInterval: 30000, // Refresh ogni 30 secondi
  });

  const staff = data?.staff ?? [];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Staff Activity Monitor</h1>
        <p className="text-sm text-muted-foreground">Monitor real-time staff status and productivity.</p>
      </div>

      {isLoading ? (
        <div className="text-center p-12 text-muted-foreground">Loading active staff...</div>
      ) : staff.length === 0 ? (
        <div className="text-center p-12 bg-card rounded-xl border border-dashed text-muted-foreground">
          No staff members are currently working.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((session) => (
            <div key={session.id} className="bg-card rounded-xl card-shadow border p-4 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{session.staff?.name}</h3>
                    <p className="text-xs text-muted-foreground">{session.staff?.role?.role_name ?? "Staff"}</p>
                  </div>
                </div>
                <StatusBadge status={session.status} />
              </div>

              <div className="grid grid-cols-2 gap-4 py-2 border-y text-xs">
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Start Time
                  </span>
                  <span className="font-medium">{new Date(session.start_time).toLocaleTimeString()}</span>
                </div>
                <div className="flex flex-col gap-1 text-right">
                  <span className="text-muted-foreground flex items-center gap-1 justify-end">
                    <Coffee className="w-3 h-3" /> Break Time
                  </span>
                  <span className="font-medium">{session.total_break_minutes} mins</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-muted-foreground">Working for</span>
                <span className="font-bold text-primary">
                  {Math.floor((new Date().getTime() - new Date(session.start_time).getTime()) / 60000) - session.total_break_minutes} mins (net)
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download, Calendar } from "lucide-react";
import { getWorkReport } from "@/services/staff";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";

export default function WorkReports() {
  const [dates, setDates] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["work-report", dates],
    queryFn: () => getWorkReport(dates.start, dates.end),
  });

  const report = data?.report ?? [];

  const handleExportCSV = () => {
    if (report.length === 0) return;
    
    const headers = ["Date", "Staff Name", "Role", "Login", "Logout", "Total Hours", "Status"];
    const rows = report.map(r => [
      r.date,
      r.staff?.name ?? "—",
      r.staff?.role?.role_name ?? "Staff",
      r.login_time ? new Date(r.login_time).toLocaleTimeString() : "—",
      r.logout_time ? new Date(r.logout_time).toLocaleTimeString() : "—",
      r.total_hours,
      r.status
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Work & Attendance Reports</h1>
          <p className="text-sm text-muted-foreground">Analyze staff working hours and attendance history.</p>
        </div>
        <Button onClick={handleExportCSV} disabled={report.length === 0} variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 card-shadow">
        <div className="flex flex-wrap items-center gap-4 mb-6">
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

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground font-medium border-b">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Staff</th>
                <th className="px-4 py-3">Login</th>
                <th className="px-4 py-3">Logout</th>
                <th className="px-4 py-3">Total Hours</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading report data...</td></tr>
              ) : report.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No data found for selected range.</td></tr>
              ) : (
                report.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{r.date}</td>
                    <td className="px-4 py-3">
                      <div>{r.staff?.name}</div>
                      <div className="text-xs text-muted-foreground">{r.staff?.role?.role_name ?? "Staff"}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">{r.login_time ? new Date(r.login_time).toLocaleTimeString() : "—"}</td>
                    <td className="px-4 py-3 text-xs">{r.logout_time ? new Date(r.logout_time).toLocaleTimeString() : "—"}</td>
                    <td className="px-4 py-3 font-bold text-primary">{r.total_hours}h</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

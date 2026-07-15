import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, History, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { apiRequest } from "@/services/api";

interface ActivityDto {
  id: number;
  order_id: number;
  user_id: number | null;
  action: string;
  description: string;
  created_at: string;
  user?: {
    name: string;
  } | null;
  order?: {
    order_number: string;
  } | null;
}

interface PaginatedActivities {
  data: ActivityDto[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export default function ActivityLogList() {
  const [page, setPage] = useState(1);

  const { data: activitiesData, isLoading } = useQuery<PaginatedActivities>({
    queryKey: ["activities", "list", page],
    queryFn: () => apiRequest<PaginatedActivities>(`/api/activities?page=${page}&per_page=15`),
  });

  const activities = activitiesData?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Logs"
        subtitle="Track system events and user actions across all orders"
      />

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center text-center p-6">
            <History className="h-10 w-10 text-muted-foreground mb-3 opacity-60" />
            <p className="text-sm font-medium text-foreground">No activities logged yet</p>
            <p className="text-xs text-muted-foreground mt-1">Actions taken on orders will appear here automatically.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-3">Date & Time</div>
              <div className="col-span-2">User</div>
              <div className="col-span-2">Order</div>
              <div className="col-span-5">Activity</div>
            </div>

            <div className="divide-y divide-border">
              {activities.map((act) => (
                <div key={act.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-muted/10 transition-colors items-center text-sm">
                  {/* Mobile header view / Desktop Col 1 */}
                  <div className="col-span-3 text-muted-foreground md:text-foreground">
                    <span className="md:hidden font-semibold mr-1.5">Time:</span>
                    {format(new Date(act.created_at), "dd MMM yyyy, hh:mm a")}
                  </div>

                  {/* Desktop Col 2 */}
                  <div className="col-span-2 font-medium text-foreground">
                    <span className="md:hidden text-muted-foreground font-semibold mr-1.5">User:</span>
                    {act.user?.name ?? "System"}
                  </div>

                  {/* Desktop Col 3 */}
                  <div className="col-span-2">
                    <span className="md:hidden text-muted-foreground font-semibold mr-1.5">Order:</span>
                    {act.order ? (
                      <Link
                        to={`/orders/${act.order_id}`}
                        className="inline-flex items-center gap-1.5 text-primary font-medium hover:underline"
                      >
                        <Package className="h-3.5 w-3.5 shrink-0" />
                        {act.order.order_number}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>

                  {/* Desktop Col 4 */}
                  <div className="col-span-5 text-foreground">
                    <span className="md:hidden text-muted-foreground font-semibold mr-1.5">Activity:</span>
                    {act.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {activitiesData && activitiesData.total > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page * 15 >= activitiesData.total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium">{(page - 1) * 15 + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(page * 15, activitiesData.total)}
                  </span>{" "}
                  of <span className="font-medium">{activitiesData.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px gap-2" aria-label="Pagination">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={page * 15 >= activitiesData.total}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

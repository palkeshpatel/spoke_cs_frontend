import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, History, Loader2, ArrowUpRight, ArrowDownLeft, ShoppingBag, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import { listInventoryTransactions } from "@/services/inventory";

export default function InventoryHistoryView() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data: txData, isLoading } = useQuery({
    queryKey: ["inventory_transactions", page],
    queryFn: () => listInventoryTransactions({ page, per_page: 20 }),
  });

  const transactions = txData?.data ?? [];
  const totalPages = txData ? Math.ceil(txData.total / txData.per_page) : 1;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "add":
        return <ArrowDownLeft className="h-4 w-4 text-emerald-600 bg-emerald-50 rounded-full p-0.5" />;
      case "remove":
        return <ArrowUpRight className="h-4 w-4 text-rose-600 bg-rose-50 rounded-full p-0.5" />;
      case "order_used":
        return <ShoppingBag className="h-4 w-4 text-blue-600 bg-blue-50 rounded-full p-0.5" />;
      case "adjustment":
      default:
        return <Settings className="h-4 w-4 text-amber-600 bg-amber-50 rounded-full p-0.5" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "add":
        return "Stock Added";
      case "remove":
        return "Stock Removed";
      case "order_used":
        return "Used in Order";
      case "adjustment":
      default:
        return "Stock Adjustment";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock History"
        subtitle="Track all fabric stock transactions and movements"
        backTo="/inventory"
      />

      <SectionCard title="Transaction Log">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No stock transactions recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-medium text-muted-foreground">
                    <th className="p-3.5">Date & Time</th>
                    <th className="p-3.5">Fabric</th>
                    <th className="p-3.5">Transaction Type</th>
                    <th className="p-3.5 text-right">Quantity</th>
                    <th className="p-3.5">Reference</th>
                    <th className="p-3.5">Note</th>
                    <th className="p-3.5">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3.5 whitespace-nowrap text-muted-foreground">
                        {format(new Date(tx.created_at), "dd MMM yyyy, hh:mm a")}
                      </td>
                      <td className="p-3.5">
                        {tx.stock ? (
                          <div>
                            <span className="font-bold text-foreground block">{tx.stock.fabric_code}</span>
                            <span className="text-xs text-muted-foreground">{tx.stock.fabric_name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(tx.transaction_type)}
                          <span className="font-medium text-foreground">{getTypeName(tx.transaction_type)}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-right font-bold whitespace-nowrap">
                        <span className={tx.transaction_type === "add" ? "text-emerald-600" : "text-rose-600"}>
                          {tx.transaction_type === "add" ? "+" : "-"}
                          {Number(tx.quantity_meter).toFixed(2)} m
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap uppercase text-xs font-semibold text-muted-foreground">
                        {tx.reference_type} {tx.reference_id ? `#${tx.reference_id}` : ""}
                      </td>
                      <td className="p-3.5 text-muted-foreground max-w-xs truncate" title={tx.note ?? ""}>
                        {tx.note ?? "—"}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-muted-foreground">
                        {tx.creator?.name ?? "System"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  Showing page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
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
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

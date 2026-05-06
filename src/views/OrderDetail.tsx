import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import EditableField from "@/components/EditableField";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/StatusBadge";
import { getOrder, updateOrder } from "@/services/orders";

type ItemDraft = {
  garment_type: string | null;
  measurement_id: number | null;
  icon_path: string | null;
  note: string | null;
  quantity: string;
  price: string;
};

export default function OrderDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const orderId = id ? Number(id) : NaN;

  const [isEditing, setIsEditing] = useState(false);
  const [fabricDraft, setFabricDraft] = useState("");
  const [trialDateDraft, setTrialDateDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState<"pending" | "in_progress" | "trial" | "completed" | "delivered">("pending");
  const [notesDraft, setNotesDraft] = useState("");
  const [itemsDraft, setItemsDraft] = useState<ItemDraft[]>([]);

  const orderQuery = useQuery({
    queryKey: ["orders", "detail", orderId],
    queryFn: () => getOrder(orderId),
    enabled: Number.isFinite(orderId),
  });

  const order = orderQuery.data;
  const items = useMemo(() => order?.items ?? [], [order?.items]);

  const initDraft = useCallback(() => {
    if (!order) return;
    setFabricDraft(order.fabric ?? "");
    setTrialDateDraft(order.trial_date ?? "");
    setStatusDraft(order.status ?? "pending");
    setNotesDraft(order.notes ?? "");
    setItemsDraft(
      (order.items ?? []).map((it) => ({
        garment_type: it.garment_type ?? null,
        measurement_id: it.measurement_id ?? null,
        icon_path: it.icon_path ?? null,
        note: it.note ?? null,
        quantity: String(it.quantity ?? 1),
        price: typeof it.price === "string" ? it.price : String(it.price ?? 0),
      })),
    );
  }, [order]);

  useEffect(() => {
    if (!order) return;
    if (isEditing) return;
    initDraft();
  }, [initDraft, isEditing, order]);

  const total = useMemo(() => {
    const arr: ItemDraft[] = isEditing
      ? itemsDraft
      : items.map((it) => ({
          garment_type: it.garment_type ?? null,
          measurement_id: it.measurement_id ?? null,
          icon_path: it.icon_path ?? null,
          note: it.note ?? null,
          quantity: String(it.quantity ?? 0),
          price: typeof it.price === "string" ? it.price : String(it.price ?? 0),
        }));

    return arr.reduce((sum, it) => {
      const qty = Number(it.quantity ?? 0);
      const price = Number(it.price ?? 0);
      return sum + (Number.isFinite(qty) ? qty : 0) * (Number.isFinite(price) ? price : 0);
    }, 0);
  }, [isEditing, items, itemsDraft]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const nextItems = itemsDraft.map((it) => {
        const qty = Number(it.quantity);
        const price = Number(it.price);
        return {
          garment_type: it.garment_type,
          measurement_id: it.measurement_id,
          icon_path: it.icon_path,
          note: it.note,
          quantity: Number.isFinite(qty) ? qty : 1,
          price: Number.isFinite(price) ? price : 0,
        };
      });

      return updateOrder(orderId, {
        fabric: fabricDraft || null,
        trial_date: trialDateDraft || null,
        status: statusDraft,
        notes: notesDraft || null,
        items: nextItems,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      await queryClient.invalidateQueries({ queryKey: ["orders", "detail", orderId] });
      toast({ title: "Saved", description: "Order updated." });
      setIsEditing(false);
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err !== null && "message" in err ? String((err as { message?: unknown }).message ?? "") : "";
      toast({ title: "Save failed", description: message || "Unable to update order.", variant: "destructive" });
    },
  });

  if (!Number.isFinite(orderId)) {
    return <div className="p-8 text-center text-muted-foreground">Order not found</div>;
  }

  if (orderQuery.isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading order...</div>;
  }

  if (!order) {
    return <div className="p-8 text-center text-muted-foreground">Order not found</div>;
  }

  return (
    <div>
      <PageHeader
        title={order.order_number}
        subtitle={order.customer?.name ?? "—"}
        backTo="/orders"
        isEditing={isEditing}
        onEdit={() => {
          initDraft();
          setIsEditing(true);
        }}
        onSave={() => saveMutation.mutate()}
        onCancel={() => {
          initDraft();
          setIsEditing(false);
        }}
      />

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <SectionCard title="Order Information">
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <EditableField label="Order Number" value={order.order_number} isEditing={false} onChange={() => {}} />
              <StatusBadge status={isEditing ? statusDraft : order.status} />
            </div>

            <EditableField label="Customer" value={order.customer?.name ?? "—"} isEditing={false} onChange={() => {}} />

            <div>
              <p className="text-xs text-muted-foreground mb-1">Trial Date</p>
              {isEditing ? (
                <Input type="date" value={trialDateDraft} onChange={(e) => setTrialDateDraft(e.target.value)} className="text-sm" />
              ) : (
                <p className="text-sm font-medium text-foreground">
                  {order.trial_date ? format(new Date(order.trial_date), "dd-MMM-yyyy") : "—"}
                </p>
              )}
            </div>

            <EditableField
              label="Status"
              value={isEditing ? statusDraft : order.status}
              isEditing={isEditing}
              type="select"
              options={[
                { value: "pending", label: "pending" },
                { value: "in_progress", label: "in_progress" },
                { value: "trial", label: "trial" },
                { value: "completed", label: "completed" },
                { value: "delivered", label: "delivered" },
              ]}
              onChange={(v) => setStatusDraft(v as typeof statusDraft)}
            />
          </div>
        </SectionCard>

        <SectionCard title="Fabric & Notes">
          <div className="space-y-4">
            <EditableField
              label="Fabric"
              value={isEditing ? fabricDraft : order.fabric ?? "—"}
              isEditing={isEditing}
              onChange={(v) => setFabricDraft(v)}
            />
            <EditableField
              label="Notes"
              value={isEditing ? notesDraft : order.notes ?? "No notes"}
              isEditing={isEditing}
              type="textarea"
              onChange={(v) => setNotesDraft(v)}
            />
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Items">
        <div className="overflow-x-auto">
          <table className="w-full mb-4">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground py-2">Qty</th>
                <th className="text-right text-xs font-medium text-muted-foreground py-2">Price</th>
              </tr>
            </thead>
            <tbody>
              {(isEditing ? itemsDraft : items.map((it) => ({
                    garment_type: it.garment_type ?? null,
                    measurement_id: it.measurement_id ?? null,
                    icon_path: it.icon_path ?? null,
                    note: it.note ?? null,
                    quantity: String(it.quantity ?? 1),
                    price: typeof it.price === "string" ? it.price : String(it.price ?? 0),
                  }))
              ).map((item, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="text-sm py-2">
                    {isEditing ? (
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => setItemsDraft((prev) => prev.map((x, idx) => (idx === i ? { ...x, quantity: e.target.value } : x)))}
                        className="h-9 w-24"
                      />
                    ) : (
                      item.quantity
                    )}
                  </td>
                  <td className="text-sm py-2 text-right">
                    {isEditing ? (
                      <div className="flex justify-end">
                        <Input
                          type="number"
                          value={item.price}
                          onChange={(e) => setItemsDraft((prev) => prev.map((x, idx) => (idx === i ? { ...x, price: e.target.value } : x)))}
                          className="h-9 w-28 text-right"
                        />
                      </div>
                    ) : (
                      `$${(Number(item.price) * Number(item.quantity)).toFixed(2)}`
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end border-t border-border pt-3">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-xl font-bold">${total.toFixed(2)}</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

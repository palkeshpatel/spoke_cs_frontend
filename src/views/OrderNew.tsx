import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import CustomerSelectWithAdd from "@/components/CustomerSelectWithAdd";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { createOrder } from "@/services/orders";

export default function OrderNew() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [fabric, setFabric] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cid = params.get("customer_id");
    if (cid) setCustomerId(cid);
  }, [location.search]);

  const createMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({
        title: "Order created",
        description: `Order #${created.order_number} created.`,
      });
      navigate(`/orders/${created.id}`);
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message?: unknown }).message ?? "")
          : "";
      toast({
        title: "Create failed",
        description: message || "Unable to create order.",
        variant: "destructive",
      });
    },
  });

  const submit = () => {
    if (!customerId) {
      toast({
        title: "Customer required",
        description: "Please select customer.",
        variant: "destructive",
      });
      return;
    }

    const p = price.trim() === "" ? 0 : Number(price);
    createMutation.mutate({
      customer_id: Number(customerId),
      fabric: fabric || null,
      notes: notes || null,
      items: [
        {
          garment_type: null,
          quantity: 1,
          price: Number.isFinite(p) ? p : 0,
        },
      ],
    });
  };

  return (
    <div>
      <PageHeader
        title="New Order"
        subtitle="Create a new order"
        backTo="/orders"
      />

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <SectionCard title="Order Details">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Customer *
              </label>
              <CustomerSelectWithAdd
                value={customerId}
                onChange={setCustomerId}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Order details are now kept simple and can be refined later.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Fabric & Style">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Fabric
              </label>
              <Input
                placeholder="e.g. Italian Wool - Navy Blue"
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Price ($)
              </label>
              <Input
                type="number"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Notes
              </label>
              <Textarea
                placeholder="Add order notes..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="cancel" onClick={() => navigate("/orders")}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating..." : "Create Order"}
        </Button>
      </div>
    </div>
  );
}

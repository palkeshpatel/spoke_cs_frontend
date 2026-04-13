import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { listCustomers } from "@/services/customers";
import { createOrder } from "@/services/orders";

export default function OrderNew() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [orderType, setOrderType] = useState<string>("Custom Suit");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [fabric, setFabric] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cid = params.get("customer_id");
    if (cid) setCustomerId(cid);
  }, [location.search]);

  const customersQuery = useQuery({
    queryKey: ["customers", "list"],
    queryFn: () => listCustomers(200),
  });

  const createMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Order created", description: `Order #${created.order_number} created.` });
      navigate(`/orders/${created.id}`);
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err !== null && "message" in err ? String((err as { message?: unknown }).message ?? "") : "";
      toast({ title: "Create failed", description: message || "Unable to create order.", variant: "destructive" });
    },
  });

  const submit = () => {
    if (!customerId) {
      toast({ title: "Customer required", description: "Please select customer.", variant: "destructive" });
      return;
    }

    const p = price.trim() === "" ? 0 : Number(price);
    createMutation.mutate({
      customer_id: Number(customerId),
      order_type: orderType,
      fabric: fabric || null,
      delivery_date: deliveryDate || null,
      notes: notes || null,
      items: [
        {
          garment_type: orderType,
          quantity: 1,
          price: Number.isFinite(p) ? p : 0,
        },
      ],
    });
  };

  return (
    <div>
      <PageHeader title="New Order" subtitle="Create a new order" backTo="/orders" />

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <SectionCard title="Order Details">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Customer *</label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder={customersQuery.isLoading ? "Loading customers..." : "Select customer"} />
                </SelectTrigger>
                <SelectContent>
                  {(customersQuery.data?.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} ({c.customer_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Garment Type *</label>
              <Select value={orderType} onValueChange={setOrderType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Custom Suit">Custom Suit</SelectItem>
                  <SelectItem value="Dress Shirt">Dress Shirt</SelectItem>
                  <SelectItem value="Dress Pants">Dress Pants</SelectItem>
                  <SelectItem value="Custom Blazer">Custom Blazer</SelectItem>
                  <SelectItem value="Alteration">Alteration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Delivery Date</label>
              <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Fabric & Style">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Fabric</label>
              <Input placeholder="e.g. Italian Wool - Navy Blue" value={fabric} onChange={(e) => setFabric(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Price ($)</label>
              <Input type="number" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
              <Textarea placeholder="Add order notes..." rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
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

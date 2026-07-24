import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Search,
  Plus,
  ArrowUpDown,
  History,
  Edit,
  Loader2,
  Trash,
  Upload,
  Sparkles,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  listInventoryStocks,
  listGarments,
  createGarment,
  saveInventoryStock,
  adjustInventoryStock,
  InventoryStock,
  Garment
} from "@/services/inventory";
import { apiBaseUrl } from "@/services/api";
import { useNavigate } from "react-router-dom";

export default function InventoryList() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Filters state
  const [search, setSearch] = useState("");
  const [selectedGarment, setSelectedGarment] = useState("all");
  const [selectedColor, setSelectedColor] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [page, setPage] = useState(1);

  // Modals / Drawers state
  const [addRemoveOpen, setAddRemoveOpen] = useState(false);
  const [fabricFormOpen, setFabricFormOpen] = useState(false);
  const [newGarmentOpen, setNewGarmentOpen] = useState(false);
  const [newGarmentName, setNewGarmentName] = useState("");
  const [editingFabric, setEditingFabric] = useState<InventoryStock | null>(null);

  // Transaction adjustment form state
  const [selectedFabricId, setSelectedFabricId] = useState<string>("");
  const [txType, setTxType] = useState<"add" | "remove">("add");
  const [txQty, setTxQty] = useState<string>("0");
  const [txNote, setTxNote] = useState("");

  // Queries
  const { data: garments, refetch: refetchGarments } = useQuery({
    queryKey: ["garments"],
    queryFn: listGarments,
  });

  const { data: stocksData, isLoading, refetch: refetchStocks } = useQuery({
    queryKey: ["inventory_stocks", page, search, selectedGarment, selectedColor, selectedStatus],
    queryFn: () =>
      listInventoryStocks({
        page,
        per_page: 10,
        search,
        garment_id: selectedGarment === "all" ? "" : selectedGarment,
        color: selectedColor === "all" ? "" : selectedColor,
        status: selectedStatus === "all" ? "" : selectedStatus,
      }),
  });

  // Get active fabric for details in side drawer
  const activeFabric = stocksData?.data.find(s => String(s.id) === selectedFabricId);

  // Form hook for new/edit fabric
  const { register, handleSubmit, reset, setValue, watch } = useForm();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFormGarments, setSelectedFormGarments] = useState<string[]>([]);

  // Watch for Edit Modal population
  useEffect(() => {
    if (editingFabric) {
      setValue("fabric_code", editingFabric.fabric_code);
      setValue("fabric_name", editingFabric.fabric_name);
      setValue("color", editingFabric.color ?? "");
      setValue("composition", editingFabric.composition ?? "");
      setValue("width_cm", editingFabric.width_cm ?? "");
      setValue("weight_gsm", editingFabric.weight_gsm ?? "");
      setValue("lead_time_days", editingFabric.lead_time_days ?? "");
      setValue("price_per_meter", editingFabric.price_per_meter);
      setValue("total_stock_meter", editingFabric.total_stock_meter);
      setSelectedFormGarments(editingFabric.garments?.map(g => String(g.id)) ?? []);
    } else {
      reset({
        fabric_code: "",
        fabric_name: "",
        color: "",
        composition: "",
        width_cm: "",
        weight_gsm: "",
        lead_time_days: "",
        price_per_meter: "",
        total_stock_meter: "",
      });
      setSelectedFormGarments([]);
      setSelectedFile(null);
    }
  }, [editingFabric, setValue, reset]);

  // Unique colors helper list from active stocks
  const availableColors = Array.from(
    new Set(
      (stocksData?.data ?? [])
        .map(s => s.color)
        .filter(Boolean)
    )
  );

  // Mutations
  const createGarmentMutation = useMutation({
    mutationFn: createGarment,
    onSuccess: () => {
      refetchGarments();
      setNewGarmentOpen(false);
      setNewGarmentName("");
      toast.success("Garment added successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add garment");
    }
  });

  const saveFabricMutation = useMutation({
    mutationFn: (formData: FormData) => saveInventoryStock(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory_stocks"] });
      setFabricFormOpen(false);
      setEditingFabric(null);
      toast.success("Fabric saved successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save fabric");
    }
  });

  const adjustStockMutation = useMutation({
    mutationFn: (payload: { id: number; type: "add" | "remove"; qty: number; note: string }) =>
      adjustInventoryStock(payload.id, {
        transaction_type: payload.type,
        quantity_meter: payload.qty,
        note: payload.note,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory_stocks"] });
      setAddRemoveOpen(false);
      setSelectedFabricId("");
      setTxQty("0");
      setTxNote("");
      toast.success("Stock level updated");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update stock");
    }
  });

  const onSubmitFabric = (data: any) => {
    const formData = new FormData();
    if (editingFabric) {
      formData.append("id", String(editingFabric.id));
    }
    formData.append("fabric_code", data.fabric_code);
    formData.append("fabric_name", data.fabric_code);
    formData.append("color", data.color || "");
    formData.append("price_per_meter", data.price_per_meter);
    formData.append("total_stock_meter", data.total_stock_meter);

    if (selectedFile) {
      formData.append("image_file", selectedFile);
    }

    saveFabricMutation.mutate(formData);
  };

  const handleSaveAdjustment = () => {
    if (!selectedFabricId) {
      toast.error("Please select a fabric");
      return;
    }
    const qtyNum = parseFloat(txQty);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      toast.error("Please enter a valid meter quantity");
      return;
    }
    adjustStockMutation.mutate({
      id: Number(selectedFabricId),
      type: txType,
      qty: qtyNum,
      note: txNote,
    });
  };

  // Preview logic for Side Drawer
  const previewStock = () => {
    if (!activeFabric) return null;
    const qty = parseFloat(txQty) || 0;
    const currentTotal = parseFloat(String(activeFabric.total_stock_meter));
    const currentReserved = parseFloat(String(activeFabric.reserved_meter));
    const currentAvailable = parseFloat(String(activeFabric.available_meter));

    if (txType === "add") {
      return {
        total: (currentTotal + qty).toFixed(2),
        reserved: currentReserved.toFixed(2),
        available: (currentAvailable + qty).toFixed(2),
      };
    } else {
      return {
        total: Math.max(0, currentTotal - qty).toFixed(2),
        reserved: currentReserved.toFixed(2),
        available: Math.max(0, currentAvailable - qty).toFixed(2),
      };
    }
  };

  const preview = previewStock();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">Manage your fabric stock and trace movements</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate("/inventory/history")} className="gap-2">
            <History className="h-4 w-4" /> Stock History
          </Button>
          <Button onClick={() => { setEditingFabric(null); setFabricFormOpen(true); }} className="gap-2 bg-primary">
            <Plus className="h-4 w-4" /> Add Fabric
          </Button>
          <Button onClick={() => setAddRemoveOpen(true)} className="gap-2 bg-[#704214] hover:bg-[#5C330E] text-white">
            <Plus className="h-4 w-4" /> Add / Remove Stock
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 p-4 bg-card border border-border rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by fabric code, name or color..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* Garment filter */}
        <div className="w-full md:w-48">
          <Select value={selectedGarment} onValueChange={setSelectedGarment}>
            <SelectTrigger>
              <SelectValue placeholder="Garment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Garments</SelectItem>
              {garments?.map((g) => (
                <SelectItem key={g.id} value={String(g.id)}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Color Filter */}
        <div className="w-full md:w-40">
          <Select value={selectedColor} onValueChange={setSelectedColor}>
            <SelectTrigger>
              <SelectValue placeholder="Color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Colors</SelectItem>
              {availableColors.map((color) => (
                <SelectItem key={color} value={color}>
                  {color}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-40">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Stock Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="low_stock">Low Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            setSearch("");
            setSelectedGarment("all");
            setSelectedColor("all");
            setSelectedStatus("all");
          }}
        >
          Reset
        </Button>
      </div>

      {/* Main Stock Table */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-medium text-muted-foreground">
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Color</th>
                  <th className="p-3.5">Price/Meter</th>
                  <th className="p-3.5 text-right">Available</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stocksData?.data.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/10 transition-colors">

                    <td className="p-3.5 font-bold uppercase text-xs text-muted-foreground">
                      {item.fabric_code}
                    </td>
                    <td className="p-3.5">
                      {item.color ?? "—"}
                    </td>
                    <td className="p-3.5 font-medium">
                      ₹{parseFloat(String(item.price_per_meter)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3.5 text-right font-bold text-emerald-600">
                      {Number(item.available_meter).toFixed(2)} m
                    </td>
                    <td className="p-3.5">
                      {item.status === "in_stock" && (
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200">
                          In Stock
                        </Badge>
                      )}
                      {item.status === "low_stock" && (
                        <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200">
                          Low Stock
                        </Badge>
                      )}
                      {item.status === "out_of_stock" && (
                        <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-50 border-rose-200">
                          Out of Stock
                        </Badge>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <Button variant="ghost" size="icon" onClick={() => setEditingFabric(item)}>
                        <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {stocksData && Math.ceil(stocksData.total / stocksData.per_page) > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Showing page {page} of {Math.ceil(stocksData.total / stocksData.per_page)}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === Math.ceil(stocksData.total / stocksData.per_page)}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Fabric Modal Dialog */}
      <Dialog open={fabricFormOpen || !!editingFabric} onOpenChange={(open) => {
        if (!open) {
          setFabricFormOpen(false);
          setEditingFabric(null);
        }
      }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingFabric ? "Edit Fabric" : "Add New Fabric"}</DialogTitle>
            <DialogDescription>Define fabric specs, cost, and starting stock levels.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmitFabric)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fabric_code">Fabric Code *</Label>
                <Input id="fabric_code" required {...register("fabric_code")} />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <Input id="color" {...register("color")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price_per_meter">Price/Meter *</Label>
                <Input id="price_per_meter" type="number" step="0.01" required {...register("price_per_meter")} />
              </div>
              <div>
                <Label htmlFor="total_stock_meter">Total Stock (Meters) *</Label>
                <Input id="total_stock_meter" type="number" step="0.01" required {...register("total_stock_meter")} />
              </div>
            </div>

            <div>
              <Label htmlFor="image_file">Fabric Image</Label>
              <div className="mt-1 flex items-center gap-3">
                <Input
                  id="image_file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => { setFabricFormOpen(false); setEditingFabric(null); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveFabricMutation.isPending}>
                {saveFabricMutation.isPending ? "Saving..." : "Save Fabric"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add New Garment Inline Dialog */}
      <Dialog open={newGarmentOpen} onOpenChange={setNewGarmentOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Garment Type</DialogTitle>
            <DialogDescription>Define a new garment type (e.g. Shirt, Kurta).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="garment_name">Garment Name</Label>
              <Input
                id="garment_name"
                value={newGarmentName}
                onChange={(e) => setNewGarmentName(e.target.value)}
                placeholder="e.g. Kurta"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewGarmentOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (newGarmentName.trim()) createGarmentMutation.mutate(newGarmentName.trim());
              }}
              disabled={createGarmentMutation.isPending}
            >
              Add Garment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Remove Stock Drawer (Sheet) */}
      <Sheet open={addRemoveOpen} onOpenChange={setAddRemoveOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add / Remove Stock</SheetTitle>
            <SheetDescription>Deduct or increment stock levels manually.</SheetDescription>
          </SheetHeader>

          <div className="space-y-6 pt-6">
            <div>
              <Label htmlFor="tx_fabric">Select Fabric *</Label>
              <Select value={selectedFabricId} onValueChange={setSelectedFabricId}>
                <SelectTrigger id="tx_fabric">
                  <SelectValue placeholder="Choose fabric..." />
                </SelectTrigger>
                <SelectContent>
                  {stocksData?.data.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.fabric_code} - {item.fabric_name} ({item.color})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Current Summary */}
            {activeFabric && (
              <div className="p-4 bg-muted/50 border rounded-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Current Stock Summary
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 border rounded bg-card">
                    <span className="block text-[11px] text-muted-foreground">Total Stock</span>
                    <span className="text-sm font-semibold">{activeFabric.total_stock_meter} m</span>
                  </div>
                  <div className="p-2 border rounded bg-card">
                    <span className="block text-[11px] text-muted-foreground">Reserved</span>
                    <span className="text-sm font-semibold">{activeFabric.reserved_meter} m</span>
                  </div>
                  <div className="p-2 border rounded bg-card">
                    <span className="block text-[11px] text-muted-foreground text-emerald-600 font-medium">Available</span>
                    <span className="text-sm font-bold text-emerald-600">{activeFabric.available_meter} m</span>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Type Radio group */}
            <div className="space-y-2">
              <Label>Transaction Type *</Label>
              <RadioGroup
                value={txType}
                onValueChange={(val: "add" | "remove") => setTxType(val)}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer bg-card hover:bg-muted/10">
                  <RadioGroupItem value="add" id="tx_add" />
                  <Label htmlFor="tx_add" className="cursor-pointer">
                    <span className="block font-semibold">Add Stock</span>
                    <span className="text-[10px] text-muted-foreground">Increase available stock</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer bg-card hover:bg-muted/10">
                  <RadioGroupItem value="remove" id="tx_remove" />
                  <Label htmlFor="tx_remove" className="cursor-pointer">
                    <span className="block font-semibold">Remove Stock</span>
                    <span className="text-[10px] text-muted-foreground">Decrease available stock</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Quantity */}
            <div>
              <Label htmlFor="tx_qty">Quantity (Meter) *</Label>
              <div className="relative">
                <Input
                  id="tx_qty"
                  type="number"
                  step="0.01"
                  value={txQty}
                  onChange={(e) => setTxQty(e.target.value)}
                />
                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">m</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="tx_note">Reference / Note</Label>
              <Textarea
                id="tx_note"
                value={txNote}
                onChange={(e) => setTxNote(e.target.value)}
                placeholder="e.g. Purchase invoice #1234, manual calibration etc."
              />
            </div>

            {/* Preview new levels */}
            {activeFabric && preview && (
              <div className="p-4 bg-muted/50 border rounded-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Preview Adjustments
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 border rounded bg-card">
                    <span className="block text-[11px] text-muted-foreground">New Total</span>
                    <span className="text-sm font-semibold">{preview.total} m</span>
                  </div>
                  <div className="p-2 border rounded bg-card">
                    <span className="block text-[11px] text-muted-foreground">Reserved</span>
                    <span className="text-sm font-semibold">{preview.reserved} m</span>
                  </div>
                  <div className="p-2 border rounded bg-card">
                    <span className="block text-[11px] text-muted-foreground text-emerald-600 font-medium">New Available</span>
                    <span className="text-sm font-bold text-emerald-600">{preview.available} m</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={() => setAddRemoveOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSaveAdjustment} disabled={adjustStockMutation.isPending}>
                {adjustStockMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

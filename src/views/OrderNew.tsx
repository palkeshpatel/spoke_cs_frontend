import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { Camera, FileImage, Loader2, Plus, Trash2, Sliders, Check, Minus, Info } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import CustomerSelectWithAdd from "@/components/CustomerSelectWithAdd";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { createOrder, uploadOrderItemIcon } from "@/services/orders";
import { resolvePublicUrl } from "@/services/api";
import { ImagePreviewDialog } from "@/components/ImagePreviewDialog";
import { getCustomer, uploadCustomerBodyImage } from "@/services/customers";
import { OrderCustomizationDialog } from "@/components/OrderCustomizationDialog";
import DatePicker from "@/components/DatePicker";
import { OrderStatusStepper } from "@/components/OrderStatusStepper";
import { listCustomizations } from "@/services/customizations";
import { listGarments, listInventoryStocks } from "@/services/inventory";
import { apiBaseUrl } from "@/services/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type ItemDetailRow = {
  garment_type: string;
  icon_path: string | null;
  note: string;
  isUploading: boolean;
  handwork: boolean;
  customizations: Record<number, { priceModifier: number, note: string }>;
};

type SelectedFabricItem = {
  fabricId: number;
  fabricCode: string;
  fabricName: string;
  color: string;
  pricePerMeter: number;
  meterRequired: number;
  icon_path: string | null;
};

export default function OrderNew() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState<string>("");
  const [status, setStatus] = useState<"measurement" | "cutting" | "stitching" | "trial_1" | "trial_2" | "delivery">("measurement");
  const [trialDate, setTrialDate] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  
  // Independent stitching items list
  const [detailRows, setDetailRows] = useState<ItemDetailRow[]>([
    { garment_type: "", icon_path: null, note: "", isUploading: false, handwork: false, customizations: {} }
  ]);

  // Selected fabrics from inventory
  const [selectedFabrics, setSelectedFabrics] = useState<SelectedFabricItem[]>([]);
  const [selectedGarmentId, setSelectedGarmentId] = useState<string>("");
  const [activeFabricId, setActiveFabricId] = useState<string>("");
  const [meterRequired, setMeterRequired] = useState<number>(3.25);

  const [activeCustomizationRowIndex, setActiveCustomizationRowIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const bodyImageRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Fetch customizations
  const { data: customizationsData } = useQuery({
    queryKey: ["customizations"],
    queryFn: listCustomizations,
  });

  const optionsMap = useMemo(() => {
    const map = new Map<number, string>();
    if (!customizationsData) return map;
    Object.values(customizationsData).forEach((categories: any) => {
      categories.forEach((cat: any) => {
        cat.options.forEach((opt: any) => {
          map.set(opt.id, opt.name);
        });
      });
    });
    return map;
  }, [customizationsData]);

  // Fetch garments
  const { data: garments } = useQuery({
    queryKey: ["garments"],
    queryFn: listGarments,
  });

  // Fetch stocks for selected garment
  const { data: fabricStocksData, isLoading: isLoadingFabrics } = useQuery({
    queryKey: ["order_fabric_stocks", selectedGarmentId],
    queryFn: () => listInventoryStocks({ garment_id: selectedGarmentId }),
    enabled: !!selectedGarmentId,
  });

  const fabrics = useMemo(() => {
    if (!fabricStocksData?.data) return [];
    return fabricStocksData.data.filter(s => s.status !== "out_of_stock");
  }, [fabricStocksData]);

  const selectedCustomerId = customerId ? Number(customerId) : NaN;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cid = params.get("customer_id");
    if (cid) setCustomerId(cid);
  }, [location.search]);

  // Reset active fabric selection when garment changes
  useEffect(() => {
    setActiveFabricId("");
    setMeterRequired(3.25);
  }, [selectedGarmentId]);

  const activeFabric = useMemo(() => {
    if (!fabricStocksData || !activeFabricId) return null;
    return fabricStocksData.data.find(s => String(s.id) === activeFabricId) || null;
  }, [fabricStocksData, activeFabricId]);

  const isAlreadyAdded = useMemo(() => {
    if (!activeFabric) return false;
    return selectedFabrics.some(item => item.fabricId === activeFabric.id);
  }, [activeFabric, selectedFabrics]);

  // Detail row functions
  const updateRowGarment = (index: number, val: string) => {
    setDetailRows(prev => prev.map((row, i) => i === index ? { ...row, garment_type: val } : row));
  };

  const updateRowNote = (index: number, val: string) => {
    setDetailRows(prev => prev.map((row, i) => i === index ? { ...row, note: val } : row));
  };

  const addDetailRow = () => {
    setDetailRows(prev => [...prev, { garment_type: "", icon_path: null, note: "", isUploading: false, handwork: false, customizations: {} }]);
  };

  const removeDetailRow = (index: number) => {
    setDetailRows(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const selectIconFile = (index: number) => {
    fileInputRefs.current[index]?.click();
  };

  const handleIconUpload = async (index: number, file: File | null) => {
    if (!file) return;
    setDetailRows(prev => prev.map((row, i) => i === index ? { ...row, isUploading: true } : row));
    try {
      const uploaded = await uploadOrderItemIcon({ blob: file, fileName: file.name });
      setDetailRows(prev => prev.map((row, i) => i === index ? { ...row, icon_path: uploaded.icon_path, isUploading: false } : row));
      toast({
        title: "Image uploaded",
        description: "Stitching item thumbnail uploaded.",
      });
    } catch (err: any) {
      setDetailRows(prev => prev.map((row, i) => i === index ? { ...row, isUploading: false } : row));
      toast({
        title: "Upload failed",
        description: err.message || "Unable to upload thumbnail.",
        variant: "destructive",
      });
    }
  };

  const handleAddFabricToOrder = () => {
    if (!selectedGarmentId) {
      toast({ title: "Validation Error", description: "Please select a product/garment", variant: "destructive" });
      return;
    }
    if (!activeFabric) {
      toast({ title: "Validation Error", description: "Please select a fabric", variant: "destructive" });
      return;
    }
    if (meterRequired <= 0) {
      toast({ title: "Validation Error", description: "Meter required must be greater than 0", variant: "destructive" });
      return;
    }
    if (meterRequired > parseFloat(String(activeFabric.available_meter))) {
      toast({ title: "Validation Error", description: "Not enough stock available", variant: "destructive" });
      return;
    }

    const newItem: SelectedFabricItem = {
      fabricId: activeFabric.id,
      fabricCode: activeFabric.fabric_code,
      fabricName: activeFabric.fabric_name,
      color: activeFabric.color ?? "",
      pricePerMeter: parseFloat(String(activeFabric.price_per_meter)),
      meterRequired,
      icon_path: activeFabric.image,
    };

    setSelectedFabrics(prev => [...prev, newItem]);
    
    toast({
      title: "Material added",
      description: `${newItem.fabricCode} added to selected items.`,
    });
  };

  const handleRemoveFabric = (index: number) => {
    setSelectedFabrics(prev => prev.filter((_, i) => i !== index));
  };

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
    onError: (err: any) => {
      toast({
        title: "Create failed",
        description: err.message || "Unable to create order.",
        variant: "destructive",
      });
    },
  });

  const customerQuery = useQuery({
    queryKey: ["customers", "detail", selectedCustomerId],
    queryFn: () => getCustomer(selectedCustomerId),
    enabled: Number.isFinite(selectedCustomerId),
  });

  const bodyImageUploadMutation = useMutation({
    mutationFn: async (params: { imageType: string; file: File }) =>
      uploadCustomerBodyImage({
        customerId: selectedCustomerId,
        imageType: params.imageType,
        blob: params.file,
        fileName: params.file.name,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customers", "detail", selectedCustomerId] });
      toast({
        title: "Image uploaded",
        description: "Client body image uploaded successfully.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Upload failed",
        description: err.message || "Unable to upload body image.",
        variant: "destructive",
      });
    },
  });

  const handleBodyImagePick = (type: string, file: File | null) => {
    if (!file) return;
    bodyImageUploadMutation.mutate({ imageType: type, file });
  };

  const submit = () => {
    if (!customerId) {
      toast({
        title: "Customer required",
        description: "Please select customer.",
        variant: "destructive",
      });
      return;
    }
    
    const stitchingItems = detailRows.map((row) => ({
      garment_type: row.garment_type || null,
      quantity: 1,
      price: 0,
      icon_path: row.icon_path,
      note: row.note.trim() || null,
      handwork: row.handwork,
      customization_flags: Object.keys(row.customizations).length > 0 ? JSON.stringify(row.customizations) : null,
      inventory_stock_id: null,
      meter_required: null
    }));

    const fabricItems = selectedFabrics.map((fab) => ({
      garment_type: null,
      quantity: 1,
      price: fab.pricePerMeter * fab.meterRequired,
      icon_path: fab.icon_path,
      note: null,
      handwork: false,
      customization_flags: null,
      inventory_stock_id: fab.fabricId,
      meter_required: fab.meterRequired
    }));

    createMutation.mutate({
      customer_id: Number(customerId),
      fabric: selectedFabrics.map(i => i.fabricCode).join(", "),
      notes: notes || null,
      status: status,
      trial_date: trialDate || null,
      delivery_date: deliveryDate || null,
      items: [...stitchingItems, ...fabricItems],
      customizations: [],
    });
  };

  const imageTypes = [
    { key: "full_body", label: "Full Photo" },
    { key: "portrait", label: "Short Photo" },
    { key: "front_body", label: "Front Body" },
    { key: "side_body", label: "Side Body" },
    { key: "shoulder", label: "Shoulder" },
    { key: "back", label: "Back (Body Back)" },
  ];

  const bodyImagesByType = useMemo(() => {
    const map = new Map<string, { id: number; path: string }>();
    for (const img of customerQuery.data?.bodyImages ?? []) {
      map.set(img.image_type, { id: img.id, path: img.image_path });
    }
    return map;
  }, [customerQuery.data?.bodyImages]);

  const openBodyImagePicker = (type: string) => {
    if (!Number.isFinite(selectedCustomerId)) {
      toast({
        title: "Select customer first",
        description: "Please select customer before uploading images.",
        variant: "destructive",
      });
      return;
    }
    bodyImageRefs.current[type]?.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Order"
        subtitle="Create a new order"
        backTo="/orders"
      />

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        {/* Customer Select & Order Level Config */}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground mb-3 block">Status</label>
                <div className="bg-muted/30 border border-border rounded-xl px-4 py-6">
                  <OrderStatusStepper status={status} onChange={(s) => setStatus(s as any)} isEditing={true} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Trial Date</label>
                <DatePicker value={trialDate} onChange={setTrialDate} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Delivery Date</label>
                <DatePicker value={deliveryDate} onChange={setDeliveryDate} />
              </div>
            </div>

            {/* Items details list (Independent stitching items) */}
            <div className="space-y-3 pt-3 border-t">
              <label className="text-xs font-semibold text-foreground block">Items details</label>
              <div className="space-y-3 rounded-xl border border-border p-3 sm:p-4">
                {detailRows.map((row, index) => (
                  <div key={index} className="flex flex-row items-start gap-2.5 w-full pb-3 border-b border-border last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-1.5 shrink-0 pt-2">
                      <span className="text-xs font-medium text-muted-foreground w-4 text-center">{index + 1}.</span>
                      
                      {row.isUploading ? (
                        <div className="h-10 w-10 shrink-0 rounded-md border border-border flex items-center justify-center bg-muted/20">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : row.icon_path ? (
                        <div className="relative h-10 w-10 shrink-0 rounded-md border border-border bg-muted/20 overflow-hidden group">
                          <ImagePreviewDialog src={resolvePublicUrl(row.icon_path)!} alt="Icon">
                            <img src={resolvePublicUrl(row.icon_path) ?? ""} alt="Icon" className="h-full w-full object-cover cursor-pointer" />
                          </ImagePreviewDialog>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectIconFile(index);
                            }}
                            className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-black/80 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity animate-fade-in"
                            title="Change image"
                          >
                            <Camera className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => selectIconFile(index)}
                          className="h-10 w-10 shrink-0"
                          title="Upload image"
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <input
                      ref={(el) => {
                        fileInputRefs.current[index] = el;
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        handleIconUpload(index, file);
                        e.currentTarget.value = "";
                      }}
                    />

                    <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <select
                          value={row.garment_type}
                          onChange={(e) => updateRowGarment(index, e.target.value)}
                          className="flex h-8 w-full max-w-[200px] rounded-md border border-input bg-background px-2.5 py-1 text-xs font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="">Select Garment...</option>
                          {garments?.map((g) => (
                            <option key={g.id} value={g.name}>{g.name}</option>
                          ))}
                        </select>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDetailRow(index)}
                          disabled={detailRows.length <= 1}
                          className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/5 shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <Input
                        placeholder="Note"
                        value={row.note}
                        onChange={(e) => updateRowNote(index, e.target.value)}
                        className="w-full h-8 text-xs"
                      />

                      <div className="flex items-center gap-4 px-0.5">
                        <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={row.handwork}
                            onChange={(e) => {
                              const val = e.target.checked;
                              setDetailRows(prev => prev.map((r, i) => i === index ? { ...r, handwork: val } : r));
                            }}
                            className="rounded border-input text-primary focus:ring-primary h-3 w-3"
                          />
                          Handwork
                        </label>

                        <div className="flex items-center gap-1.5">
                          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={Object.keys(row.customizations).length > 0}
                              onChange={(e) => {
                                if (!e.target.checked) {
                                  setDetailRows(prev => prev.map((r, i) => i === index ? { ...r, customizations: {} } : r));
                                } else {
                                  setActiveCustomizationRowIndex(index);
                                }
                              }}
                              className="rounded border-input text-primary focus:ring-primary h-3 w-3"
                            />
                            Advanced Customization
                          </label>
                          {Object.keys(row.customizations).length > 0 && (
                            <span 
                              onClick={() => setActiveCustomizationRowIndex(index)}
                              className="text-[11px] text-primary font-medium hover:underline cursor-pointer"
                            >
                              ({Object.keys(row.customizations)
                                .map((id) => optionsMap.get(Number(id)) || "")
                                .filter(Boolean)
                                .slice(0, 2)
                                .join(", ")}
                              {Object.keys(row.customizations).length > 2 && "..."})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addDetailRow} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
          </div>
        </SectionCard>

        {/* Global Notes */}
        <SectionCard title="Notes">
          <div className="space-y-4">
            <div>
              <Textarea
                placeholder="Add order notes..."
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Product & Fabric Selection Panel (Image 1 Mockup) */}
      <div className="grid lg:grid-cols-12 gap-6 bg-card border border-border rounded-xl p-4 sm:p-6">
        
        {/* Left Column (5/12): Select Garment & Fabric table */}
        <div className="lg:col-span-5 space-y-4 border-r border-border pr-0 lg:pr-6">
          <div>
            <h3 className="font-bold text-base text-foreground mb-1">Product Material Selection</h3>
            <p className="text-xs text-muted-foreground">Select material from inventory to include in this order</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Select Product / Garment</label>
              <Select value={selectedGarmentId} onValueChange={setSelectedGarmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose garment..." />
                </SelectTrigger>
                <SelectContent>
                  {garments?.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedGarmentId && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Material Type</span>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700">In Stock</Badge>
                </div>

                {isLoadingFabrics ? (
                  <div className="flex h-36 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : fabrics.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">No fabric stock found for this garment.</p>
                ) : (
                  <div className="overflow-hidden border border-border rounded-lg max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-muted/40 text-muted-foreground border-b font-medium">
                          <th className="p-2 w-8"></th>
                          <th className="p-2">Fabric</th>
                          <th className="p-2">Code</th>
                          <th className="p-2 text-right">Price/M</th>
                          <th className="p-2 text-right">Available</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {fabrics.map((item) => (
                          <tr
                            key={item.id}
                            className={`hover:bg-muted/20 cursor-pointer ${activeFabricId === String(item.id) ? "bg-muted/50" : ""}`}
                            onClick={() => setActiveFabricId(String(item.id))}
                          >
                            <td className="p-2 text-center">
                              <input
                                type="radio"
                                name="active_fabric"
                                checked={activeFabricId === String(item.id)}
                                onChange={() => setActiveFabricId(String(item.id))}
                                className="h-3 w-3 text-primary focus:ring-primary"
                              />
                            </td>
                            <td className="p-2 font-medium flex items-center gap-2">
                              <div className="h-6 w-6 rounded bg-muted overflow-hidden shrink-0">
                                {item.image ? (
                                  <img src={`${apiBaseUrl}/storage/${item.image}`} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center bg-muted text-[9px] font-bold">
                                    {item.fabric_code.substring(0, 2)}
                                  </div>
                                )}
                              </div>
                              <span className="truncate max-w-[100px]">{item.fabric_name}</span>
                            </td>
                            <td className="p-2 uppercase font-semibold text-muted-foreground">{item.fabric_code}</td>
                            <td className="p-2 text-right">₹{parseFloat(String(item.price_per_meter)).toLocaleString("en-IN")}</td>
                            <td className="p-2 text-right font-semibold text-emerald-600">{Number(item.available_meter).toFixed(2)} m</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Middle Column (4/12): Material Details */}
        <div className="lg:col-span-4 space-y-4 border-r border-border pr-0 lg:pr-6">
          <h3 className="font-bold text-sm text-foreground">Material Details</h3>

          {activeFabric ? (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="h-20 w-24 rounded-lg bg-muted border overflow-hidden shrink-0">
                  {activeFabric.image ? (
                    <img src={`${apiBaseUrl}/storage/${activeFabric.image}`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground font-bold">
                      {activeFabric.fabric_code}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{activeFabric.fabric_code}</h4>
                  <p className="text-xs text-muted-foreground">{activeFabric.fabric_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{activeFabric.color}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-2 text-xs border-y py-3">
                <span className="text-muted-foreground">Composition</span>
                <span className="text-right font-medium">{activeFabric.composition || "—"}</span>
                <span className="text-muted-foreground">Width</span>
                <span className="text-right font-medium">{activeFabric.width_cm ? `${activeFabric.width_cm} cm` : "—"}</span>
                <span className="text-muted-foreground">Weight</span>
                <span className="text-right font-medium">{activeFabric.weight_gsm ? `${activeFabric.weight_gsm} GSM` : "—"}</span>
                <span className="text-muted-foreground">Lead Time</span>
                <span className="text-right font-medium">{activeFabric.lead_time_days ? `${activeFabric.lead_time_days} Days` : "—"}</span>
                <span className="text-muted-foreground">Price / Meter</span>
                <span className="text-right font-bold text-foreground">₹{parseFloat(String(activeFabric.price_per_meter)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Meter required input counter */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground block font-medium">Meter Required *</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border rounded-lg overflow-hidden bg-card">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setMeterRequired(m => Math.max(0.1, m - 0.25))}
                      className="h-8 w-8 rounded-none border-r"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <Input
                      type="number"
                      step="0.01"
                      value={meterRequired}
                      onChange={(e) => setMeterRequired(Math.max(0.1, parseFloat(e.target.value) || 0))}
                      className="w-16 h-8 border-none text-center font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus-visible:ring-0"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setMeterRequired(m => m + 0.25)}
                      className="h-8 w-8 rounded-none border-l"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Available: <span className="font-semibold text-emerald-600">{Number(activeFabric.available_meter).toFixed(2)} m</span>
                  </span>
                </div>
              </div>

              <Button
                onClick={handleAddFabricToOrder}
                className="w-full bg-primary mt-2"
                disabled={isAlreadyAdded}
              >
                {isAlreadyAdded ? "Added to Order" : "Add To Order"}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 border border-dashed rounded-xl p-4 text-center text-xs text-muted-foreground">
              <Info className="h-6 w-6 mb-2 text-muted-foreground/60" />
              Please select a garment and click on a fabric row to see details and configure quantities.
            </div>
          )}
        </div>

        {/* Right Column (3/12): Selected Items (Fabrics Summary) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground">Selected Items ({selectedFabrics.length})</h3>
            {selectedFabrics.length > 0 && (
              <Button variant="ghost" size="icon" onClick={() => setSelectedFabrics([])} className="h-8 w-8 text-destructive hover:bg-destructive/5">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {selectedFabrics.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 border border-dashed rounded-xl p-4 text-center text-xs text-muted-foreground">
              No items selected yet. Use the selector on the left to add items.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {selectedFabrics.map((item, index) => (
                <div key={index} className="relative border border-border bg-muted/20 p-3 rounded-xl space-y-2">
                  <div className="flex gap-2.5">
                    <div className="h-10 w-10 shrink-0 rounded bg-muted border overflow-hidden">
                      {item.icon_path ? (
                        <img src={`${apiBaseUrl}/storage/${item.icon_path}`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-muted text-[10px] font-bold">
                          {item.fabricCode.substring(0, 2)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-foreground block">{item.fabricName}</span>
                      <span className="text-[10px] text-muted-foreground block truncate">
                        {item.fabricCode} | {item.color}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFabric(index)}
                      className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-dashed">
                    <span className="text-muted-foreground">Meter: {item.meterRequired} m</span>
                    <span className="font-bold">₹{(item.pricePerMeter * item.meterRequired).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t text-sm font-bold flex justify-between">
                <span>Total Amount:</span>
                <span>
                  ₹{selectedFabrics.reduce((acc, curr) => acc + (curr.pricePerMeter * curr.meterRequired), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Body Images */}
      <SectionCard title="Add Images Section">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Body Images</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {imageTypes.map((type) => {
              const existing = bodyImagesByType.get(type.key);
              const preview = resolvePublicUrl(existing?.path ?? null);
              const isUploading = bodyImageUploadMutation.isPending && bodyImageUploadMutation.variables?.imageType === type.key;

              return (
                <div key={type.key} className="rounded-xl border border-border p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">{type.label}</p>
                  {isUploading ? (
                    <div className="w-full h-28 rounded-lg border border-border bg-muted/20 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : preview ? (
                    <div className="relative w-full h-28 rounded-lg overflow-hidden group border border-border bg-muted/20">
                      <ImagePreviewDialog src={preview} alt={type.label}>
                        <img src={preview} alt={type.label} className="h-full w-full object-cover" />
                      </ImagePreviewDialog>
                      <button
                        type="button"
                        onClick={() => openBodyImagePicker(type.key)}
                        className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openBodyImagePicker(type.key)}
                      className="w-full h-28 rounded-lg border border-dashed border-border bg-muted/20 flex items-center justify-center overflow-hidden hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <FileImage className="h-4 w-4" />
                        <span className="text-[11px]">Upload</span>
                      </div>
                    </button>
                  )}
                  <input
                    ref={(el) => {
                      bodyImageRefs.current[type.key] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      handleBodyImagePick(type.key, file);
                      e.currentTarget.value = "";
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </SectionCard>

      {/* Buttons */}
      <div className="flex gap-2 justify-end">
        <Button variant="cancel" onClick={() => navigate("/orders")}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating..." : "Create Order"}
        </Button>
      </div>

      {/* Customization Dialog */}
      <OrderCustomizationDialog
        open={activeCustomizationRowIndex !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setActiveCustomizationRowIndex(null);
        }}
        selectedOptions={
          activeCustomizationRowIndex !== null
            ? detailRows[activeCustomizationRowIndex]?.customizations ?? {}
            : {}
        }
        onSelectionChange={(newCustomizations) => {
          if (activeCustomizationRowIndex !== null) {
            setDetailRows(prev =>
              prev.map((row, i) =>
                i === activeCustomizationRowIndex
                  ? { ...row, customizations: newCustomizations }
                  : row
              )
            );
          }
        }}
      />
    </div>
  );
}

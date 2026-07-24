import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Camera, FileImage, Loader2, Plus, Trash2, Sliders, Check, Minus, Info, Edit2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import CustomerSelectWithAdd from "@/components/CustomerSelectWithAdd";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { createOrder, updateOrder, getOrder, uploadOrderItemIcon } from "@/services/orders";
import { resolvePublicUrl } from "@/services/api";
import { ImagePreviewDialog } from "@/components/ImagePreviewDialog";
import { getCustomer, uploadCustomerBodyImage } from "@/services/customers";
import { OrderCustomizationDialog } from "@/components/OrderCustomizationDialog";
import DatePicker from "@/components/DatePicker";
import { OrderStatusStepper } from "@/components/OrderStatusStepper";
import { listCustomizations } from "@/services/customizations";
import { listGarments, listInventoryStocks } from "@/services/inventory";
import { apiBaseUrl } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type SwatchDetail = {
  id: string;
  note: string;
  handwork: boolean;
  handworkPrice?: number | null;
  handworkNotes?: string | null;
  customizations: Record<number, { priceModifier: number, note: string }>;
  customImage: string | null;
  isUploading?: boolean;
};

type OrderItemEntry = {
  id: string; // Unique local identifier
  type: "in_stock" | "swatch";
  garmentName: string;
  garmentId?: number;
  // For in_stock items:
  fabricId?: number;
  fabricCode?: string;
  fabricName?: string;
  color?: string;
  pricePerMeter?: number;
  meterRequired?: number;
  icon_path?: string | null;
  // For swatch items:
  swatches: SwatchDetail[];
  // Common parameters for in-stock inline details:
  note: string;
  handwork: boolean;
  handworkPrice?: number | null;
  handworkNotes?: string | null;
  customizations: Record<number, { priceModifier: number, note: string }>;
};

const categoryImages: Record<string, string> = {
  "Nawabi / Sherwani": "nawabi.webp",
  "Kurta": "kurta.webp",
  "Trouser": "trouser.webp",
  "Nehru Jacket": "nehru-jacket.webp",
  "Jodhpuri": "jodhpuri.webp",
  "Indo-Western": "indo-wester.webp",
  "Suits": "suits.webp",
  "Shirts": "shirts.webp",
  "Jacket": "jacket.webp",
  "Tuxedo": "tuxedo.webp",
  "Co-ord Set": "co-ord-set.webp",
};

export default function OrderNew() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const isEdit = !!id;
  const orderId = isEdit ? Number(id) : NaN;

  const orderQuery = useQuery({
    queryKey: ["orders", "detail", orderId],
    queryFn: () => getOrder(orderId),
    enabled: isEdit && !Number.isNaN(orderId),
  });

  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState<string>("");
  const [status, setStatus] = useState<"measurement" | "cutting" | "stitching" | "trial_1" | "trial_2" | "delivery">("measurement");
  const [trialDate, setTrialDate] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");

  // Step 1: Selected Category
  const [selectedGarmentName, setSelectedGarmentName] = useState<string>("");
  const [selectedGarmentId, setSelectedGarmentId] = useState<number | undefined>(undefined);

  // Step 2: Tab selection & Fabric selection
  const [activeTab, setActiveTab] = useState<"in_stock" | "swatch">("in_stock");
  const [fabricSearch, setFabricSearch] = useState<string>("");
  const [activeFabric, setActiveFabric] = useState<any | null>(null);

  // Swatch / On Demand fields
  const [swatchNote, setSwatchNote] = useState<string>("");
  const [swatchHandwork, setSwatchHandwork] = useState<boolean>(false);
  const [swatchHandworkPrice, setSwatchHandworkPrice] = useState<number | null>(null);
  const [swatchHandworkNotes, setSwatchHandworkNotes] = useState<string>("");
  const [swatchCustomizations, setSwatchCustomizations] = useState<Record<number, { priceModifier: number, note: string }>>({});
  const [swatchImage, setSwatchImage] = useState<string | null>(null);
  const [swatchUploading, setSwatchUploading] = useState<boolean>(false);

  // Step 3: Fabric Details options / Staged Swatches Details options
  const [stagedSwatches, setStagedSwatches] = useState<SwatchDetail[]>([]);
  const [fabricHandwork, setFabricHandwork] = useState<boolean>(false);
  const [fabricHandworkPrice, setFabricHandworkPrice] = useState<number | null>(null);
  const [fabricHandworkNotes, setFabricHandworkNotes] = useState<string>("");
  const [fabricCustomizations, setFabricCustomizations] = useState<Record<number, { priceModifier: number, note: string }>>({});
  const [fabricMeter, setFabricMeter] = useState<number>(3.25);

  // Handwork Details Dialog state
  const [handworkDialogOpen, setHandworkDialogOpen] = useState<boolean>(false);
  const [handworkPriceInput, setHandworkPriceInput] = useState<string>("");
  const [handworkNotesInput, setHandworkNotesInput] = useState<string>("");
  const [activeHandworkTarget, setActiveHandworkTarget] = useState<
    "fabric" | "swatch" | { type: "staged_swatch"; index: number } | null
  >(null);

  // Master lists
  const [orderItems, setOrderItems] = useState<OrderItemEntry[]>([]);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingStagedSwatchIndex, setEditingStagedSwatchIndex] = useState<number | null>(null);

  // Dialog triggers
  const [customizationDialogOpen, setCustomizationDialogOpen] = useState<boolean>(false);
  const [activeCustomizationTarget, setActiveCustomizationTarget] = useState<
    | "fabric"
    | "swatch"
    | { type: "item"; index: number }
    | { type: "staged_swatch"; index: number }
    | null
  >(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stagedSwatchFileInputRef = useRef<HTMLInputElement | null>(null);
  const bodyImageRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const isAlreadyAdded = useMemo(() => {
    if (!activeFabric) return false;
    return orderItems.some((item) => item.fabricId === activeFabric.id);
  }, [activeFabric, orderItems]);

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

  // Fetch fabrics (unconditional, no category filtering)
  const { data: fabricStocksData, isLoading: isLoadingFabrics } = useQuery({
    queryKey: ["order_fabric_stocks"],
    queryFn: () => listInventoryStocks({}),
  });

  // Filter fabrics based on search query
  const fabrics = useMemo(() => {
    if (!fabricStocksData?.data) return [];
    return fabricStocksData.data.filter((s) => {
      const matchStatus = s.status !== "out_of_stock";
      const matchQuery =
        !fabricSearch ||
        s.fabric_code.toLowerCase().includes(fabricSearch.toLowerCase()) ||
        (s.color && s.color.toLowerCase().includes(fabricSearch.toLowerCase())) ||
        s.fabric_name.toLowerCase().includes(fabricSearch.toLowerCase());
      return matchStatus && matchQuery;
    });
  }, [fabricStocksData, fabricSearch]);

  useEffect(() => {
    if (isEdit && orderQuery.data) {
      const order = orderQuery.data;
      setCustomerId(order.customer_id.toString());
      setNotes(order.notes || "");
      setStatus(order.status as any);
      setTrialDate(order.trial_date || "");
      setDeliveryDate(order.delivery_date || "");
      
      const items: OrderItemEntry[] = [];
      const swatchesByGarment = new Map<string, any[]>();

      order.items?.forEach((it: any) => {
        const parsedCustomizations = typeof it.customization_flags === "string" && it.customization_flags.length > 0 
          ? JSON.parse(it.customization_flags) 
          : (it.customization_flags || {});
          
        if (it.inventory_stock_id) {
          // In Stock
          items.push({
            id: it.id.toString() + Math.random(),
            type: "in_stock",
            garmentName: it.garment_type || "",
            fabricId: it.inventory_stock_id,
            fabricCode: it.inventory_stock?.fabric_code || "Unknown",
            fabricName: it.inventory_stock?.fabric_name || "Unknown",
            color: it.inventory_stock?.color || "",
            pricePerMeter: it.inventory_stock?.price_per_meter ? Number(it.inventory_stock.price_per_meter) : 0,
            meterRequired: Number(it.meter_required),
            icon_path: it.icon_path,
            note: it.note || "",
            handwork: !!it.handwork,
            handworkPrice: it.handwork_price,
            handworkNotes: it.handwork_notes,
            customizations: parsedCustomizations,
            swatches: [],
          });
        } else {
          // Swatch
          const garment = it.garment_type || "Unknown";
          if (!swatchesByGarment.has(garment)) {
            swatchesByGarment.set(garment, []);
          }
          swatchesByGarment.get(garment)!.push({
            id: it.id.toString() + Math.random(),
            note: it.note || "",
            handwork: !!it.handwork,
            handworkPrice: it.handwork_price,
            handworkNotes: it.handwork_notes,
            customizations: parsedCustomizations,
            customImage: it.icon_path,
          });
        }
      });

      // Group swatches
      swatchesByGarment.forEach((swatches, garmentName) => {
        items.push({
          id: garmentName + Math.random(),
          type: "swatch",
          garmentName,
          note: "",
          handwork: false,
          customizations: {},
          swatches,
        });
      });

      setOrderItems(items);
    }
  }, [isEdit, orderQuery.data]);

  const selectedCustomerId = customerId ? Number(customerId) : NaN;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cid = params.get("customer_id");
    if (cid) setCustomerId(cid);
  }, [location.search]);

  // Reset states when garment category changes
  useEffect(() => {
    setActiveFabric(null);
    setStagedSwatches([]);
    setFabricMeter(3.25);
    setFabricHandwork(false);
    setFabricHandworkPrice(null);
    setFabricHandworkNotes("");
    setFabricCustomizations({});
    setSwatchNote("");
    setSwatchHandwork(false);
    setSwatchHandworkPrice(null);
    setSwatchHandworkNotes("");
    setSwatchCustomizations({});
    setSwatchImage(null);
    setEditingItemIndex(null);
  }, [selectedGarmentId]);

  // Swatch image upload in Step 2
  const handleSwatchImageUpload = async (file: File | null) => {
    if (!file) return;
    setSwatchUploading(true);
    try {
      const uploaded = await uploadOrderItemIcon({ blob: file, fileName: file.name });
      setSwatchImage(uploaded.icon_path);
      setSwatchUploading(false);
      toast({ title: "Image uploaded", description: "Swatch photo updated successfully." });
    } catch (err: any) {
      setSwatchUploading(false);
      toast({ title: "Upload failed", description: err.message || "Unable to upload photo.", variant: "destructive" });
    }
  };

  // Swatch image upload inside Step 3 Staged Swatches Details
  const handleStagedSwatchImageUpload = async (index: number, file: File | null) => {
    if (!file) return;
    setStagedSwatches(prev => prev.map((sw, i) => i === index ? { ...sw, isUploading: true } : sw));
    try {
      const uploaded = await uploadOrderItemIcon({ blob: file, fileName: file.name });
      setStagedSwatches(prev => prev.map((sw, i) => i === index ? { ...sw, customImage: uploaded.icon_path, isUploading: false } : sw));
      toast({ title: "Image uploaded", description: "Swatch photo updated successfully." });
    } catch (err: any) {
      setStagedSwatches(prev => prev.map((sw, i) => i === index ? { ...sw, isUploading: false } : sw));
      toast({ title: "Upload failed", description: err.message || "Unable to upload photo.", variant: "destructive" });
    }
  };

  // Handwork Dialog handlers
  const handleOpenHandworkDialog = (target: typeof activeHandworkTarget) => {
    setActiveHandworkTarget(target);
    if (target === "fabric") {
      setHandworkPriceInput(fabricHandworkPrice ? String(fabricHandworkPrice) : "");
      setHandworkNotesInput(fabricHandworkNotes || "");
    } else if (target === "swatch") {
      setHandworkPriceInput(swatchHandworkPrice ? String(swatchHandworkPrice) : "");
      setHandworkNotesInput(swatchHandworkNotes || "");
    } else if (target?.type === "staged_swatch") {
      const sw = stagedSwatches[target.index];
      if (sw) {
        setHandworkPriceInput(sw.handworkPrice ? String(sw.handworkPrice) : "");
        setHandworkNotesInput(sw.handworkNotes || "");
      }
    }
    setHandworkDialogOpen(true);
  };

  const handleSaveHandworkDetails = () => {
    const price = parseFloat(handworkPriceInput) || 0;
    const detailsNote = handworkNotesInput;

    if (activeHandworkTarget === "fabric") {
      setFabricHandwork(true);
      setFabricHandworkPrice(price);
      setFabricHandworkNotes(detailsNote);
    } else if (activeHandworkTarget === "swatch") {
      setSwatchHandwork(true);
      setSwatchHandworkPrice(price);
      setSwatchHandworkNotes(detailsNote);
    } else if (activeHandworkTarget?.type === "staged_swatch") {
      const idx = activeHandworkTarget.index;
      setStagedSwatches(prev => prev.map((sw, i) => i === idx ? {
        ...sw,
        handwork: true,
        handworkPrice: price,
        handworkNotes: detailsNote
      } : sw));
    }

    setHandworkDialogOpen(false);
    setActiveHandworkTarget(null);
    toast({ title: "Handwork details saved" });
  };

  // Add or Update In-Stock fabric item in order
  const handleAddInStockItem = () => {
    if (!selectedGarmentName) {
      toast({ title: "Validation Error", description: "Please select category first.", variant: "destructive" });
      return;
    }
    if (!activeFabric) {
      toast({ title: "Validation Error", description: "Please select a fabric.", variant: "destructive" });
      return;
    }
    if (fabricMeter <= 0) {
      toast({ title: "Validation Error", description: "Meter required must be greater than 0.", variant: "destructive" });
      return;
    }

    if (editingItemIndex !== null) {
      setOrderItems((prev) =>
        prev.map((item, idx) => {
          if (idx === editingItemIndex) {
            return {
              ...item,
              fabricId: activeFabric.id,
              fabricCode: activeFabric.fabric_code,
              fabricName: activeFabric.fabric_name,
              color: activeFabric.color ?? "",
              pricePerMeter: parseFloat(String(activeFabric.price_per_meter)),
              meterRequired: fabricMeter,
              handwork: fabricHandwork,
              handworkPrice: fabricHandworkPrice,
              handworkNotes: fabricHandworkNotes,
              customizations: { ...fabricCustomizations },
              icon_path: activeFabric.image,
            };
          }
          return item;
        })
      );
      setEditingItemIndex(null);
      toast({ title: "Item Updated", description: `${selectedGarmentName} order item updated.` });
    } else {


      const newItem: OrderItemEntry = {
        id: "stock-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9),
        type: "in_stock",
        garmentName: selectedGarmentName,
        garmentId: selectedGarmentId,
        fabricId: activeFabric.id,
        fabricCode: activeFabric.fabric_code,
        fabricName: activeFabric.fabric_name,
        color: activeFabric.color ?? "",
        pricePerMeter: parseFloat(String(activeFabric.price_per_meter)),
        meterRequired: fabricMeter,
        note: "",
        handwork: fabricHandwork,
        handworkPrice: fabricHandworkPrice,
        handworkNotes: fabricHandworkNotes,
        customizations: { ...fabricCustomizations },
        icon_path: activeFabric.image,
        swatches: [],
      };

      setOrderItems((prev) => [...prev, newItem]);
    }
    
    // Clear selection
    setActiveFabric(null);
    setFabricMeter(3.25);
    setFabricHandwork(false);
    setFabricHandworkPrice(null);
    setFabricHandworkNotes("");
    setFabricCustomizations({});
  };

  // Step 2: Clicking "+ Add" appends swatch to Staging List in Step 3
  const handleAddSwatchToStep3Staged = () => {
    if (!selectedGarmentName) {
      toast({ title: "Validation Error", description: "Please select a category first.", variant: "destructive" });
      return;
    }

    const newSwatch: SwatchDetail = {
      id: "swatch-row-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9),
      note: swatchNote,
      handwork: swatchHandwork,
      handworkPrice: swatchHandworkPrice,
      handworkNotes: swatchHandworkNotes,
      customizations: { ...swatchCustomizations },
      customImage: swatchImage,
    };

    setStagedSwatches((prev) => [...prev, newSwatch]);
    setActiveFabric(null); // Clear selected fabric if any

    // Clear Step 2 Swatch Form Fields
    setSwatchNote("");
    setSwatchHandwork(false);
    setSwatchHandworkPrice(null);
    setSwatchHandworkNotes("");
    setSwatchCustomizations({});
    setSwatchImage(null);
  };

  // Step 3: Add Staged Swatches to order list (Create new or Save edit)
  const handleAddStagedSwatchesToOrder = () => {
    if (!selectedGarmentName || stagedSwatches.length === 0) return;

    if (editingItemIndex !== null) {
      // Edit existing item swatches
      setOrderItems((prev) =>
        prev.map((item, idx) => {
          if (idx === editingItemIndex) {
            return {
              ...item,
              swatches: [...stagedSwatches],
            };
          }
          return item;
        })
      );
      setEditingItemIndex(null);
      toast({ title: "Swatches Updated", description: `${selectedGarmentName} swatches updated.` });
    } else {
      // Add new card
      setOrderItems((prev) => {
        const existingIdx = prev.findIndex(item => item.type === "swatch" && item.garmentName === selectedGarmentName);
        if (existingIdx !== -1) {
          return prev.map((item, idx) => {
            if (idx === existingIdx) {
              return {
                ...item,
                swatches: [...item.swatches, ...stagedSwatches],
              };
            }
            return item;
          });
        } else {
          const newCard: OrderItemEntry = {
            id: "swatch-card-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9),
            type: "swatch",
            garmentName: selectedGarmentName,
            garmentId: selectedGarmentId,
            swatches: [...stagedSwatches],
            note: "",
            handwork: false,
            customizations: {},
          };
          return [...prev, newCard];
        }
      });
    }

    setStagedSwatches([]);
  };

  // Staged inline updates in Step 3
  const handleUpdateStagedSwatchField = (index: number, fields: Partial<SwatchDetail>) => {
    setStagedSwatches(prev => prev.map((sw, i) => i === index ? { ...sw, ...fields } : sw));
  };

  const handleRemoveStagedSwatch = (index: number) => {
    setStagedSwatches(prev => prev.filter((_, i) => i !== index));
  };

  // Edit item action: loads item back to Step 3 configuration panel
  const handleStartEditItem = (index: number) => {
    const item = orderItems[index];
    if (!item) return;

    setSelectedGarmentName(item.garmentName);
    setSelectedGarmentId(item.garmentId);
    setEditingItemIndex(index);

    if (item.type === "in_stock") {
      setActiveTab("in_stock");
      const foundFabric = fabricStocksData?.data?.find((f: any) => f.id === item.fabricId);
      if (foundFabric) {
        setActiveFabric(foundFabric);
      } else {
        setActiveFabric({
          id: item.fabricId,
          fabric_code: item.fabricCode,
          fabric_name: item.fabricName,
          color: item.color,
          price_per_meter: item.pricePerMeter,
          available_meter: 9999,
          image: item.icon_path,
        });
      }
      setFabricMeter(item.meterRequired ?? 3.25);
      setFabricHandwork(item.handwork);
      setFabricHandworkPrice(item.handworkPrice ?? null);
      setFabricHandworkNotes(item.handworkNotes ?? "");
      setFabricCustomizations(item.customizations);
    } else {
      setActiveTab("swatch");
      setActiveFabric(null);
      setStagedSwatches([...item.swatches]);
    }

    toast({
      title: "Editing Mode",
      description: `Editing ${item.garmentName}. Configure under Step 3 and click 'Update to Order'.`,
    });
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
    if (editingItemIndex === index) {
      setEditingItemIndex(null);
      setActiveFabric(null);
      setStagedSwatches([]);
    }
  };

  const handleUpdateItemField = (index: number, fields: Partial<OrderItemEntry>) => {
    setOrderItems(prev => prev.map((item, i) => i === index ? { ...item, ...fields } : item));
  };

  const handleUpdateSwatchField = (itemIndex: number, swatchIndex: number, fields: Partial<SwatchDetail>) => {
    setOrderItems(prev => prev.map((item, i) => {
      if (i === itemIndex) {
        const updatedSwatches = item.swatches.map((sw, sIdx) =>
          sIdx === swatchIndex ? { ...sw, ...fields } : sw
        );
        return { ...item, swatches: updatedSwatches };
      }
      return item;
    }));
  };

  const handleSwatchRowUpload = async (itemIndex: number, swatchIndex: number, file: File | null) => {
    if (!file) return;
    setOrderItems(prev => prev.map((item, i) => {
      if (i === itemIndex) {
        const updatedSwatches = item.swatches.map((sw, sIdx) =>
          sIdx === swatchIndex ? { ...sw, isUploading: true } : sw
        );
        return { ...item, swatches: updatedSwatches };
      }
      return item;
    }));

    try {
      const uploaded = await uploadOrderItemIcon({ blob: file, fileName: file.name });
      setOrderItems(prev => prev.map((item, i) => {
        if (i === itemIndex) {
          const updatedSwatches = item.swatches.map((sw, sIdx) =>
            sIdx === swatchIndex ? { ...sw, customImage: uploaded.icon_path, isUploading: false } : sw
          );
          return { ...item, swatches: updatedSwatches };
        }
        return item;
      }));
      toast({ title: "Image uploaded", description: "Swatch image updated." });
    } catch (err: any) {
      setOrderItems(prev => prev.map((item, i) => {
        if (i === itemIndex) {
          const updatedSwatches = item.swatches.map((sw, sIdx) =>
            sIdx === swatchIndex ? { ...sw, isUploading: false } : sw
          );
          return { ...item, swatches: updatedSwatches };
        }
        return item;
      }));
      toast({ title: "Upload failed", description: err.message || "Unable to upload image.", variant: "destructive" });
    }
  };

  const handleRemoveSwatch = (itemIndex: number, swatchIndex: number) => {
    setOrderItems(prev => {
      return prev.map((item, i) => {
        if (i === itemIndex) {
          const filtered = item.swatches.filter((_, sIdx) => sIdx !== swatchIndex);
          return { ...item, swatches: filtered };
        }
        return item;
      }).filter(item => item.type !== "swatch" || item.swatches.length > 0);
    });
  };

  const createMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Order created successfully" });
      navigate("/orders");
    },
    onError: (err: any) => {
      toast({
        title: "Failed to create order",
        description: err?.message || "Please check your input",
        variant: "destructive",
      });
    },
  });

  const customerQuery = useQuery({
    queryKey: ["customers", "detail", selectedCustomerId],
    queryFn: () => getCustomer(selectedCustomerId),
    enabled: Number.isFinite(selectedCustomerId),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => updateOrder(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "detail", orderId] });
      toast({ title: "Order updated successfully" });
      navigate("/orders");
    },
    onError: (err: any) => {
      toast({
        title: "Failed to update order",
        description: err?.message || "Please check your input",
        variant: "destructive",
      });
    },
  });

  const bodyImageUploadMutation = useMutation({
    mutationFn: async (params: { imageType: string; file: File }) =>
      uploadCustomerBodyImage({
        customerId: Number(customerId),
        imageType: params.imageType,
        blob: params.file,
        fileName: params.file.name,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customers", "detail", Number(customerId)] });
      toast({ title: "Image uploaded", description: "Client body image uploaded successfully." });
    },
    onError: () => {
      toast({ title: "Upload failed", variant: "destructive" });
    },
  });

  const handleBodyImagePick = (type: string, file: File | null) => {
    if (!file) return;
    bodyImageUploadMutation.mutate({ imageType: type, file });
  };

  const submit = () => {
    if (!customerId) {
      toast({ title: "Customer required", description: "Please select customer.", variant: "destructive" });
      return;
    }
    if (orderItems.length === 0) {
      toast({ title: "Items required", description: "Please add at least one item to the order.", variant: "destructive" });
      return;
    }

    const itemsPayload: any[] = [];
    orderItems.forEach((item) => {
      if (item.type === "in_stock") {
        itemsPayload.push({
          garment_type: item.garmentName,
          quantity: 1,
          price: (item.pricePerMeter! * item.meterRequired!) + (item.handworkPrice || 0),
          icon_path: item.icon_path || null,
          note: item.note || null,
          handwork: item.handwork,
          handwork_price: item.handworkPrice || null,
          handwork_notes: item.handworkNotes || null,
          inventory_stock_id: item.fabricId,
          meter_required: item.meterRequired,
          customization_flags: Object.keys(item.customizations).length > 0 ? JSON.stringify(item.customizations) : null,
        });
      } else {
        item.swatches.forEach((sw) => {
          itemsPayload.push({
            garment_type: item.garmentName,
            quantity: 1,
            price: sw.handworkPrice || 0,
            icon_path: sw.customImage || null,
            note: sw.note || null,
            handwork: sw.handwork,
            handwork_price: sw.handworkPrice || null,
            handwork_notes: sw.handworkNotes || null,
            inventory_stock_id: null,
            meter_required: null,
            customization_flags: Object.keys(sw.customizations).length > 0 ? JSON.stringify(sw.customizations) : null,
          });
        });
      }
    });

    const payload = {
      customer_id: Number(customerId),
      fabric: orderItems.filter(i => i.type === "in_stock").map(i => i.fabricCode).join(", "),
      notes: notes || null,
      status: status,
      trial_date: trialDate || null,
      delivery_date: deliveryDate || null,
      items: itemsPayload,
      customizations: [],
    };

    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  // Pricing calculations
  const subTotal = useMemo(() => {
    return orderItems.reduce((acc, curr) => {
      if (curr.type === "in_stock") {
        return acc + (curr.pricePerMeter! * curr.meterRequired!) + (curr.handworkPrice || 0);
      } else {
        const swatchesPriceSum = curr.swatches.reduce((sum, sw) => sum + (sw.handworkPrice || 0), 0);
        return acc + swatchesPriceSum;
      }
    }, 0);
  }, [orderItems]);

  const sgst = useMemo(() => subTotal * 0.025, [subTotal]);
  const cgst = useMemo(() => subTotal * 0.025, [subTotal]);
  const grandTotal = subTotal;

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
        title={isEdit ? (orderQuery.data?.order_number || "Edit Order") : "New Order"}
        subtitle={isEdit ? "Update order details" : "Create a new order"}
        backTo={isEdit ? `/orders/${orderId}` : "/orders"}
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
          </div>
        </SectionCard>

        {/* Global Notes */}
        <SectionCard title="Notes" className="h-full flex flex-col">
          <div className="flex-1 h-full">
            <Textarea
              placeholder="Add order notes..."
              className="h-full min-h-[150px] resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </SectionCard>
      </div>

      {/* 3-Step Selection Flow Layout */}
      <div className="grid lg:grid-cols-12 gap-6 bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm">
        
        {/* Step 1: Select Category */}
        <div className="lg:col-span-4 space-y-4 border-r border-border pr-0 lg:pr-6">
          <div>
            <h3 className="font-extrabold text-base text-foreground">Select Category</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-2 max-h-[380px] overflow-y-auto pr-1">
            {garments?.map((g) => {
              const isSelected = selectedGarmentName === g.name;
              return (
                <button
                  key={g.id}
                  onClick={() => {
                    setSelectedGarmentName(g.name);
                    setSelectedGarmentId(g.id);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 text-primary font-semibold ring-2 ring-primary/20"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/30"
                  }`}
                >
                  <div className="h-8 w-8 mb-1.5 flex items-center justify-center">
                    {g.image_path ? (
                      <img
                        src={`${apiBaseUrl()}/${g.image_path.startsWith('uploads') ? '' : 'storage/'}${g.image_path}`}
                        alt={g.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-2xl">👔</span>
                    )}
                  </div>
                  <span className="text-[10px] text-center line-clamp-2 leading-tight">{g.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Select Fabric */}
        <div className="lg:col-span-5 space-y-4 border-r border-border pr-0 lg:pr-6">
          <div>
            <h3 className="font-extrabold text-base text-foreground">Select Fabric</h3>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border w-full">
            <button
              type="button"
              onClick={() => setActiveTab("in_stock")}
              className={`flex-1 text-center pb-2 text-xs font-bold transition-all border-b-2 ${
                activeTab === "in_stock"
                  ? "border-[#6B3C15] text-[#6B3C15]"
                  : "border-transparent text-muted-foreground hover:text-[#6B3C15]"
              }`}
            >
              In Stock
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("swatch")}
              className={`flex-1 text-center pb-2 text-xs font-bold transition-all border-b-2 ${
                activeTab === "swatch"
                  ? "border-[#6B3C15] text-[#6B3C15]"
                  : "border-transparent text-muted-foreground hover:text-[#6B3C15]"
              }`}
            >
              Swatch / On Demand
            </button>
          </div>

          {activeTab === "in_stock" ? (
            <div className="space-y-3">
              <Input
                placeholder="Search fabric by code or color..."
                value={fabricSearch}
                onChange={(e) => setFabricSearch(e.target.value)}
                className="h-8 text-xs"
              />

              {isLoadingFabrics ? (
                <div className="flex h-36 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : fabrics.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">No fabric stock found.</p>
              ) : (
                <div className="overflow-hidden border border-border rounded-lg max-h-[250px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/40 text-muted-foreground border-b font-medium">
                        <th className="p-2">Code</th>
                        <th className="p-2">Color</th>
                        <th className="p-2 text-right">Price/M</th>
                        <th className="p-2 text-right">Available</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {fabrics.map((item) => (
                        <tr
                          key={item.id}
                          className={`hover:bg-muted/20 cursor-pointer ${activeFabric?.id === item.id ? "bg-muted/50" : ""}`}
                          onClick={() => {
                            setActiveFabric(item);
                          }}
                        >
                          <td className="p-2 uppercase font-semibold text-muted-foreground">{item.fabric_code}</td>
                          <td className="p-2 text-muted-foreground">{item.color ?? "—"}</td>
                          <td className="p-2 text-right">₹{parseFloat(String(item.price_per_meter)).toLocaleString("en-IN")}</td>
                          <td className="p-2 text-right">
                            {(() => {
                              const avail = Number(item.available_meter);
                              let colorClass = "text-emerald-600";
                              let label = "In Stock";
                              if (avail <= 0) {
                                colorClass = "text-destructive";
                                label = "Out of Stock";
                              } else if (avail < 4) {
                                colorClass = "text-orange-500";
                                label = "Low Stock";
                              }
                              return (
                                <>
                                  <span className={`font-semibold block ${colorClass}`}>{avail.toFixed(2)} m</span>
                                  <span className="text-[9px] text-muted-foreground">{label}</span>
                                </>
                              );
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* Swatch / On Demand Custom Form */
            <div className="space-y-3 bg-muted/20 p-3 rounded-lg border border-border">
              <div className="flex gap-3">
                {swatchUploading ? (
                  <div className="h-14 w-14 shrink-0 rounded-md border border-dashed flex items-center justify-center bg-card">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : swatchImage ? (
                  <div className="relative h-14 w-14 shrink-0 rounded-md border bg-card overflow-hidden group">
                    <img src={resolvePublicUrl(swatchImage) ?? ""} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-14 w-14 shrink-0 flex flex-col gap-1 border-dashed"
                  >
                    <Camera className="h-4 w-4" />
                    <span className="text-[9px]">Photo</span>
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleSwatchImageUpload(e.target.files?.[0] ?? null)}
                />

                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground block font-medium">Stitching Note</label>
                  <Input
                    placeholder="Enter notes..."
                    value={swatchNote}
                    onChange={(e) => setSwatchNote(e.target.value)}
                    className="h-8 text-xs w-full bg-card"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 px-0.5 pt-1">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={swatchHandwork}
                    onChange={(e) => {
                      if (!e.target.checked) {
                        setSwatchHandwork(false);
                        setSwatchHandworkPrice(null);
                        setSwatchHandworkNotes("");
                      } else {
                        handleOpenHandworkDialog("swatch");
                      }
                    }}
                    className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                  />
                  Handwork
                </label>
                {swatchHandwork && (
                  <span
                    onClick={() => handleOpenHandworkDialog("swatch")}
                    className="text-[10px] text-primary font-medium hover:underline cursor-pointer"
                  >
                    (Edit Details)
                  </span>
                )}

                <div className="flex items-center gap-1.5">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Object.keys(swatchCustomizations).length > 0}
                      onChange={(e) => {
                        if (!e.target.checked) setSwatchCustomizations({});
                        else {
                          setActiveCustomizationTarget("swatch");
                          setCustomizationDialogOpen(true);
                        }
                      }}
                      className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                    />
                    Advanced Customization
                  </label>
                  {Object.keys(swatchCustomizations).length > 0 && (
                    <span
                      onClick={() => {
                        setActiveCustomizationTarget("swatch");
                        setCustomizationDialogOpen(true);
                      }}
                      className="text-[10px] text-primary font-medium hover:underline cursor-pointer"
                    >
                      ({Object.keys(swatchCustomizations).length} Selected)
                    </span>
                  )}
                </div>
              </div>

              <Button
                onClick={handleAddSwatchToStep3Staged}
                disabled={!selectedGarmentName}
                className="w-full bg-primary h-8 text-xs mt-2"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>
          )}
        </div>

        {/* Step 3: Fabric Details or Multiple Staged Swatches Details */}
        <div className="lg:col-span-3 space-y-4 pr-0">
          <div>
            <h3 className="font-extrabold text-base text-foreground">
              {activeTab === "swatch" ? "Swatch Details" : "Fabric Details"}
            </h3>
          </div>

          {activeTab === "swatch" ? (
            /* Multiple Staged Swatches Preview Panel */
            <div className="space-y-4">
              {stagedSwatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 border border-dashed rounded-xl p-4 text-center text-xs text-muted-foreground">
                  <Info className="h-6 w-6 mb-2 text-muted-foreground/60" />
                  Please add swatches in Step 2.
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {stagedSwatches.map((sw, index) => {
                    const preview = sw.customImage ? resolvePublicUrl(sw.customImage) : null;
                    return (
                      <div key={sw.id} className="p-3 border rounded-xl bg-muted/20 space-y-2 relative">
                        <div className="flex gap-2">
                          {sw.isUploading ? (
                            <div className="h-12 w-12 shrink-0 rounded bg-muted/10 border flex items-center justify-center">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            </div>
                          ) : preview ? (
                            <div className="relative h-12 w-12 shrink-0 rounded overflow-hidden border bg-card group">
                              <img src={preview} className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingStagedSwatchIndex(index);
                                  stagedSwatchFileInputRef.current?.click();
                                }}
                                className="absolute inset-0 bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Camera className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                  setEditingStagedSwatchIndex(index);
                                  stagedSwatchFileInputRef.current?.click();
                              }}
                              className="h-12 w-12 shrink-0 rounded border border-dashed flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/10"
                            >
                              <Camera className="h-4 w-4" />
                            </button>
                          )}

                          <div className="flex-1 min-w-0 pr-6">
                            <span className="text-[10px] font-bold text-muted-foreground block">Swatch #{index + 1}</span>
                            <Input
                              placeholder="Stitching Note"
                              value={sw.note}
                              onChange={(e) => handleUpdateStagedSwatchField(index, { note: e.target.value })}
                              className="h-7 text-xs bg-card mt-1"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveStagedSwatch(index)}
                            className="absolute top-2 right-2 text-muted-foreground hover:text-destructive p-0.5"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-dashed">
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={sw.handwork}
                                onChange={(e) => {
                                  if (!e.target.checked) {
                                    setStagedSwatches(prev => prev.map((item, i) => i === index ? { ...item, handwork: false, handworkPrice: null, handworkNotes: "" } : item));
                                  } else {
                                    handleOpenHandworkDialog({ type: "staged_swatch", index: index });
                                  }
                                }}
                                className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                              />
                              Handwork
                            </label>
                            {sw.handwork && (
                              <span
                                onClick={() => handleOpenHandworkDialog({ type: "staged_swatch", index: index })}
                                className="text-[9px] text-primary font-medium hover:underline cursor-pointer"
                              >
                                (Edit)
                              </span>
                            )}

                            <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={Object.keys(sw.customizations).length > 0}
                                onChange={(e) => {
                                  if (!e.target.checked) {
                                    handleUpdateStagedSwatchField(index, { customizations: {} });
                                  } else {
                                    setActiveCustomizationTarget({ type: "staged_swatch", index: index });
                                    setCustomizationDialogOpen(true);
                                  }
                                }}
                                className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                              />
                              Customization
                            </label>
                          </div>
                          {Object.keys(sw.customizations).length > 0 && (
                            <span
                              onClick={() => {
                                setActiveCustomizationTarget({ type: "staged_swatch", index: index });
                                setCustomizationDialogOpen(true);
                              }}
                              className="text-[9px] text-primary font-medium hover:underline cursor-pointer"
                            >
                              ({Object.keys(sw.customizations).length} Options)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {stagedSwatches.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="pt-2 flex justify-between items-center text-xs font-bold border-t border-dashed">
                    <span className="text-muted-foreground">Price Estimate ({stagedSwatches.length} Swatches)</span>
                    <span className="text-base text-foreground">
                      ₹{stagedSwatches.reduce((sum, sw) => sum + (sw.handworkPrice || 0), 0).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <Button
                    onClick={handleAddStagedSwatchesToOrder}
                    className="w-full bg-primary"
                  >
                    {editingItemIndex !== null ? "Update to Order" : "Add to Order"}
                  </Button>
                </div>
              )}

              <input
                ref={stagedSwatchFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (editingStagedSwatchIndex !== null) {
                    handleStagedSwatchImageUpload(editingStagedSwatchIndex, file);
                  }
                  e.currentTarget.value = "";
                }}
              />
            </div>
          ) : activeFabric ? (
            /* In-Stock Fabric Details Preview Panel */
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="h-16 w-20 rounded-lg bg-muted border overflow-hidden shrink-0">
                  {activeFabric.image ? (
                    <img src={`${apiBaseUrl()}/storage/${activeFabric.image}`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground text-xl font-bold opacity-30 uppercase">
                      {activeFabric.fabric_code.substring(0, 2)}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">{activeFabric.fabric_code}</h4>
                  <p className="text-xs text-muted-foreground">{activeFabric.fabric_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{activeFabric.color}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-2 text-xs border-y py-3">
                <span className="text-muted-foreground">Price / Meter</span>
                <span className="text-right font-bold text-foreground">₹{parseFloat(String(activeFabric.price_per_meter)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                <span className="text-muted-foreground">Available</span>
                {(() => {
                  const avail = Number(activeFabric.available_meter);
                  let colorClass = "text-emerald-600";
                  if (avail <= 0) colorClass = "text-destructive";
                  else if (avail < 4) colorClass = "text-orange-500";
                  return <span className={`text-right font-semibold ${colorClass}`}>{avail.toFixed(2)} m</span>;
                })()}
              </div>

              <div className="flex items-center gap-4 px-0.5">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={fabricHandwork}
                    onChange={(e) => {
                      if (!e.target.checked) {
                        setFabricHandwork(false);
                        setFabricHandworkPrice(null);
                        setFabricHandworkNotes("");
                      } else {
                        handleOpenHandworkDialog("fabric");
                      }
                    }}
                    className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                  />
                  Handwork
                </label>
                {fabricHandwork && (
                  <span
                    onClick={() => handleOpenHandworkDialog("fabric")}
                    className="text-[10px] text-primary font-medium hover:underline cursor-pointer"
                  >
                    (Edit Details)
                  </span>
                )}

                <div className="flex items-center gap-1.5">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Object.keys(fabricCustomizations).length > 0}
                      onChange={(e) => {
                        if (!e.target.checked) setFabricCustomizations({});
                        else {
                          setActiveCustomizationTarget("fabric");
                          setCustomizationDialogOpen(true);
                        }
                      }}
                      className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                    />
                    Advanced Customization
                  </label>
                  {Object.keys(fabricCustomizations).length > 0 && (
                    <span
                      onClick={() => {
                        setActiveCustomizationTarget("fabric");
                        setCustomizationDialogOpen(true);
                      }}
                      className="text-[10px] text-primary font-medium hover:underline cursor-pointer"
                    >
                      ({Object.keys(fabricCustomizations).length} Selected)
                    </span>
                  )}
                </div>
              </div>

              {/* Meter Required */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground block font-medium">Meter Required</label>
                <div className="flex items-center border rounded-lg overflow-hidden bg-card w-full">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setFabricMeter(m => Math.max(0.1, m - 0.25))}
                    className="h-8 w-8 rounded-none border-r shrink-0"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <Input
                    type="number"
                    step="0.01"
                    value={fabricMeter}
                    onChange={(e) => setFabricMeter(Math.max(0.1, parseFloat(e.target.value) || 0))}
                    className="flex-1 h-8 border-none text-center font-bold focus-visible:ring-0 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setFabricMeter(m => m + 0.25)}
                    className="h-8 w-8 rounded-none border-l shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-xs font-bold border-t border-dashed">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="text-base text-foreground">
                  ₹{Math.round((parseFloat(String(activeFabric.price_per_meter)) * fabricMeter) + (fabricHandworkPrice || 0)).toLocaleString("en-IN")}
                </span>
              </div>

              <Button
                onClick={handleAddInStockItem}
                className="w-full bg-primary mt-2"
                disabled={editingItemIndex === null && isAlreadyAdded}
              >
                {editingItemIndex !== null ? "Update to Order" : (isAlreadyAdded ? "Added to Order" : "Add to Order")}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 border border-dashed rounded-xl p-4 text-center text-xs text-muted-foreground">
              <Info className="h-6 w-6 mb-2 text-muted-foreground/60" />
              Please Select Fabric
            </div>
          )}
        </div>
      </div>

      {/* Bottom Layout: Order Items list & Summary */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Order Items List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center bg-card p-3 border border-border rounded-xl shadow-xs">
            <h3 className="font-extrabold text-sm text-foreground">Order Item ({orderItems.reduce((acc, curr) => acc + (curr.type === 'swatch' ? curr.swatches.length : 1), 0)})</h3>
            {orderItems.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => { setOrderItems([]); setEditingItemIndex(null); }} className="h-7 text-xs text-destructive hover:bg-destructive/5">
                Clear All
              </Button>
            )}
          </div>

          {orderItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 border border-dashed border-border rounded-xl bg-card p-4 text-center text-xs text-muted-foreground">
              No items added to the order yet.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {orderItems.map((item, itemIdx) => {
                if (item.type === "in_stock") {
                  const preview = item.icon_path ? resolvePublicUrl(item.icon_path) : null;
                  return (
                    <div key={item.id} className={`relative border bg-card p-4 rounded-xl space-y-2 shadow-xs group ${editingItemIndex === itemIdx ? "ring-2 ring-primary border-primary bg-primary/[0.01]" : "border-border"}`}>
                      <div className="flex gap-3">
                        {preview ? (
                          <div className="relative h-16 w-16 shrink-0 rounded overflow-hidden border bg-muted/20">
                            <ImagePreviewDialog src={preview} alt={item.garmentName}>
                              <img src={preview} className="h-full w-full object-cover cursor-pointer" />
                            </ImagePreviewDialog>
                          </div>
                        ) : (
                          <div className="h-16 w-16 shrink-0 rounded border border-dashed flex flex-col items-center justify-center text-muted-foreground bg-muted/10 font-bold text-[10px]">
                            {item.fabricCode?.substring(0,2)}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-extrabold text-sm text-foreground block truncate">{item.garmentName}</span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartEditItem(itemIdx)}
                                className="text-muted-foreground hover:text-foreground p-0.5 rounded border border-border bg-card"
                                title="Edit Item"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(itemIdx)}
                                className="text-muted-foreground hover:text-destructive p-0.5 rounded border border-border bg-card"
                                title="Remove item"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          <div className="text-[11px] text-muted-foreground space-y-0.5 mt-0.5">
                            <span className="block font-medium">{item.fabricCode} | {item.color}</span>
                            <span className="block">{item.meterRequired} m</span>
                            {item.note && <span className="block italic text-muted-foreground">Note: "{item.note}"</span>}
                            <span className="block font-bold text-foreground">
                              ₹{Math.round((item.pricePerMeter! * item.meterRequired!) + (item.handworkPrice || 0)).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Badges footer */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.handwork && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200" title={item.handworkNotes || undefined}>
                            Handwork {item.handworkPrice ? `(₹${item.handworkPrice})` : ""}
                          </span>
                        )}
                        {Object.keys(item.customizations).length > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            Advance Customization
                          </span>
                        )}
                      </div>
                    </div>
                  );
                } else {
                  /* Swatch Category Card with Multiple Swatches */
                  return (
                    <div key={item.id} className={`relative border bg-card p-4 rounded-xl space-y-3 shadow-xs group ${editingItemIndex === itemIdx ? "ring-2 ring-primary border-primary bg-primary/[0.01]" : "border-border"}`}>
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="font-extrabold text-sm text-foreground block">{item.garmentName}</span>
                        <div className="flex gap-1 items-center">
                          <span className="text-[10px] text-muted-foreground font-semibold mr-1">Swatch Item ({item.swatches.length})</span>
                          <button
                            type="button"
                            onClick={() => handleStartEditItem(itemIdx)}
                            className="text-muted-foreground hover:text-foreground p-0.5 rounded border border-border bg-card"
                            title="Edit Swatches"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(itemIdx)}
                            className="text-muted-foreground hover:text-destructive p-0.5 rounded border border-border bg-card"
                            title="Remove item"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {item.swatches.map((sw, swIdx) => {
                          const preview = sw.customImage ? resolvePublicUrl(sw.customImage) : null;
                          return (
                            <div key={sw.id} className="p-2 border rounded-lg bg-muted/10 space-y-1 text-xs">
                              <div className="flex gap-2 items-start">
                                {preview ? (
                                  <div className="relative h-10 w-10 shrink-0 rounded overflow-hidden border bg-card">
                                    <ImagePreviewDialog src={preview} alt={item.garmentName}>
                                      <img src={preview} className="h-full w-full object-cover cursor-pointer" />
                                    </ImagePreviewDialog>
                                  </div>
                                ) : (
                                  <div className="h-10 w-10 shrink-0 rounded border border-dashed flex items-center justify-center bg-card text-muted-foreground">
                                    <Camera className="h-4 w-4" />
                                  </div>
                                )}

                                <div className="flex-1 min-w-0">
                                  <span className="text-[10px] font-bold text-muted-foreground block">Swatch #{swIdx + 1}</span>
                                  {sw.note ? (
                                    <p className="text-xs text-foreground italic mt-0.5">"{sw.note}"</p>
                                  ) : (
                                    <p className="text-xs text-muted-foreground mt-0.5">No note</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-1 mt-1">
                                {sw.handwork && (
                                  <span className="text-[8px] bg-emerald-50 text-emerald-700 px-1 border border-emerald-200 rounded font-semibold" title={sw.handworkNotes || undefined}>
                                    Handwork {sw.handworkPrice ? `(₹${sw.handworkPrice})` : ""}
                                  </span>
                                )}
                                {Object.keys(sw.customizations).length > 0 && <span className="text-[8px] bg-blue-50 text-blue-700 px-1 border border-blue-200 rounded font-semibold">Custom ({Object.keys(sw.customizations).length})</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>

        {/* Right: Summary Card */}
        <div className="lg:col-span-4 bg-card border border-border p-4 rounded-xl shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-foreground">Summary</h3>

          {orderItems.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">Summary is empty. Add items to see estimate.</p>
          ) : (
            <div className="space-y-3.5">
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {orderItems.map((item, idx) => {
                  if (item.type === "in_stock") {
                    const fabricPrice = item.pricePerMeter! * item.meterRequired!;
                    return (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground truncate max-w-[180px]">
                            {item.garmentName} ({item.fabricCode} | {item.meterRequired} m)
                          </span>
                          <span className="font-medium">
                            ₹{Math.round(fabricPrice).toLocaleString("en-IN")}
                          </span>
                        </div>
                        {item.handwork && (
                          <div className="flex justify-between text-[11px] pl-3 italic text-muted-foreground">
                            <span>+ Handwork</span>
                            <span>₹{Math.round(item.handworkPrice || 0).toLocaleString("en-IN")}</span>
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    return (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-muted-foreground truncate max-w-[180px]">
                          {item.garmentName} (Swatch × {item.swatches.length})
                        </span>
                        <span className="font-medium">
                          ₹{item.swatches.reduce((sum, sw) => sum + (sw.handworkPrice || 0), 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    );
                  }
                })}
              </div>

              <div className="border-t pt-3.5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sub Total</span>
                  <span className="font-medium">₹{Math.round(subTotal).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SGST (2.5% Included)</span>
                  <span className="font-medium">₹{Math.round(sgst).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CGST (2.5% Included)</span>
                  <span className="font-medium">₹{Math.round(cgst).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold border-t pt-2 mt-2">
                  <span>Grand Total</span>
                  <span>₹{Math.round(grandTotal).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          )}        </div>
      </div>

      {/* Handwork Details Dialog modal */}
      <Dialog open={handworkDialogOpen} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setHandworkDialogOpen(false);
          setActiveHandworkTarget(null);
        }
      }}>
        <DialogContent className="max-w-md bg-card border border-border rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Handwork</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground block font-medium">Price</label>
              <Input
                type="number"
                placeholder="Enter handwork price..."
                value={handworkPriceInput}
                onChange={(e) => setHandworkPriceInput(e.target.value)}
                className="bg-muted/10 border-border text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground block font-medium">Notes</label>
              <Textarea
                placeholder="Enter notes..."
                value={handworkNotesInput}
                onChange={(e) => setHandworkNotesInput(e.target.value)}
                className="bg-muted/10 border-border text-sm"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => {
              setHandworkDialogOpen(false);
              setActiveHandworkTarget(null);
            }}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveHandworkDetails} className="bg-primary text-white">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <div key={type.key} className="rounded-xl border border-border p-3 space-y-2 bg-card">
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

      <div className="flex justify-end gap-4 pt-6 mt-4">
        <Button variant="outline" className="w-32" onClick={() => navigate("/orders")}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={createMutation.isPending || updateMutation.isPending} className="w-48 bg-primary text-white">
          {isEdit 
            ? (updateMutation.isPending ? "Updating..." : "Update Order") 
            : (createMutation.isPending ? "Creating..." : "Create Order")}
        </Button>
      </div>

      {/* Customization Dialog */}
      <OrderCustomizationDialog
        open={customizationDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setCustomizationDialogOpen(false);
            setActiveCustomizationTarget(null);
            setEditingItemIndex(null);
          }
        }}
        selectedOptions={
          activeCustomizationTarget === "fabric"
            ? fabricCustomizations
            : activeCustomizationTarget === "swatch"
            ? swatchCustomizations
            : activeCustomizationTarget?.type === "item"
            ? orderItems[activeCustomizationTarget.index]?.customizations ?? {}
            : activeCustomizationTarget?.type === "staged_swatch"
            ? stagedSwatches[activeCustomizationTarget.index]?.customizations ?? {}
            : {}
        }
        onSelectionChange={(newCustomizations) => {
          if (activeCustomizationTarget === "fabric") {
            setFabricCustomizations(newCustomizations);
          } else if (activeCustomizationTarget === "swatch") {
            setSwatchCustomizations(newCustomizations);
          } else if (activeCustomizationTarget?.type === "item") {
            handleUpdateItemField(activeCustomizationTarget.index, { customizations: newCustomizations });
          } else if (activeCustomizationTarget?.type === "staged_swatch") {
            handleUpdateStagedSwatchField(activeCustomizationTarget.index, { customizations: newCustomizations });
          }
        }}
      />
    </div>
  );
}

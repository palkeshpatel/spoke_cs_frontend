import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Tag } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  listCustomizations,
  createCategory,
  updateCategory,
  deleteCategory,
  createOption,
  updateOption,
  deleteOption,
  CustomizationCategoryDto,
  CustomizationOptionDto,
} from "@/services/customizations";
import { listGarments } from "@/services/inventory";

// ─── Types ─────────────────────────────────────────────────────────────────

type CategoryDialogState =
  | { mode: "add"; garmentId: number | null }
  | { mode: "edit"; category: CustomizationCategoryDto };

type OptionDialogState =
  | { mode: "add"; categoryId: number; categoryName: string }
  | { mode: "edit"; option: CustomizationOptionDto; categoryName: string };

// ─── Component ─────────────────────────────────────────────────────────────

export default function CustomizationSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: groupedData, isLoading } = useQuery({
    queryKey: ["customizations"],
    queryFn: listCustomizations,
  });

  const { data: garmentsData } = useQuery({
    queryKey: ["garments"],
    queryFn: listGarments,
  });

  // Collapsed garment sections
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Dialog state
  const [categoryDialog, setCategoryDialog] = useState<CategoryDialogState | null>(null);
  const [optionDialog, setOptionDialog] = useState<OptionDialogState | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<
    { type: "category"; id: number; name: string } | { type: "option"; id: number; name: string } | null
  >(null);

  // Form state for category dialog
  const [catName, setCatName] = useState("");
  const [catGarmentId, setCatGarmentId] = useState<string>("");
  const [catSortOrder, setCatSortOrder] = useState("0");

  // Form state for option dialog
  const [optName, setOptName] = useState("");
  const [optPrice, setOptPrice] = useState("0");
  const [optSortOrder, setOptSortOrder] = useState("0");

  const openCategoryDialog = (state: CategoryDialogState) => {
    setCategoryDialog(state);
    if (state.mode === "edit") {
      setCatName(state.category.name);
      setCatGarmentId(state.category.garment_id?.toString() ?? "");
      setCatSortOrder(state.category.sort_order?.toString() ?? "0");
    } else {
      setCatName("");
      setCatGarmentId(state.garmentId?.toString() ?? "");
      setCatSortOrder("0");
    }
  };

  const openOptionDialog = (state: OptionDialogState) => {
    setOptionDialog(state);
    if (state.mode === "edit") {
      setOptName(state.option.name);
      setOptPrice(state.option.price_modifier?.toString() ?? "0");
      setOptSortOrder(state.option.sort_order?.toString() ?? "0");
    } else {
      setOptName("");
      setOptPrice("0");
      setOptSortOrder("0");
    }
  };

  // ─── Mutations ────────────────────────────────────────────────────────────

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["customizations"] });

  const createCatMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => { invalidate(); setCategoryDialog(null); toast({ title: "Category added" }); },
    onError: () => toast({ title: "Error", description: "Could not add category", variant: "destructive" }),
  });

  const updateCatMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateCategory(id, data),
    onSuccess: () => { invalidate(); setCategoryDialog(null); toast({ title: "Category updated" }); },
    onError: () => toast({ title: "Error", description: "Could not update category", variant: "destructive" }),
  });

  const deleteCatMutation = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => { invalidate(); setDeleteDialog(null); toast({ title: "Category deleted" }); },
    onError: () => toast({ title: "Error", description: "Could not delete category", variant: "destructive" }),
  });

  const createOptMutation = useMutation({
    mutationFn: createOption,
    onSuccess: () => { invalidate(); setOptionDialog(null); toast({ title: "Option added" }); },
    onError: () => toast({ title: "Error", description: "Could not add option", variant: "destructive" }),
  });

  const updateOptMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateOption(id, data),
    onSuccess: () => { invalidate(); setOptionDialog(null); toast({ title: "Option updated" }); },
    onError: () => toast({ title: "Error", description: "Could not update option", variant: "destructive" }),
  });

  const deleteOptMutation = useMutation({
    mutationFn: (id: number) => deleteOption(id),
    onSuccess: () => { invalidate(); setDeleteDialog(null); toast({ title: "Option deleted" }); },
    onError: () => toast({ title: "Error", description: "Could not delete option", variant: "destructive" }),
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSaveCategory = () => {
    if (!catName.trim()) return;
    const payload = {
      name: catName.trim(),
      garment_id: catGarmentId ? Number(catGarmentId) : null,
      sort_order: Number(catSortOrder) || 0,
    };
    if (categoryDialog?.mode === "edit") {
      updateCatMutation.mutate({ id: categoryDialog.category.id, data: payload });
    } else {
      createCatMutation.mutate(payload);
    }
  };

  const handleSaveOption = () => {
    if (!optName.trim()) return;
    const payload = {
      name: optName.trim(),
      price_modifier: Number(optPrice) || 0,
      sort_order: Number(optSortOrder) || 0,
    };
    if (optionDialog?.mode === "edit") {
      updateOptMutation.mutate({ id: optionDialog.option.id, data: payload });
    } else if (optionDialog?.mode === "add") {
      createOptMutation.mutate({ ...payload, category_id: optionDialog.categoryId });
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteDialog) return;
    if (deleteDialog.type === "category") deleteCatMutation.mutate(deleteDialog.id);
    else deleteOptMutation.mutate(deleteDialog.id);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const garmentNames = Object.keys(groupedData ?? {});
  const garmentsList = garmentsData ?? [];

  return (
    <div className="pb-10">
      <PageHeader
        title="Customisation Settings"
        subtitle="Manage garment customization groups and options with prices"
        backTo="/settings"
        actions={
          <Button
            size="sm"
            onClick={() => openCategoryDialog({ mode: "add", garmentId: null })}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Group
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
          Loading...
        </div>
      ) : garmentNames.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <Tag className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No customisation groups yet.</p>
          <Button onClick={() => openCategoryDialog({ mode: "add", garmentId: null })}>
            <Plus className="h-4 w-4 mr-1" /> Add First Group
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {garmentNames.map((garmentName) => {
            const categories = groupedData?.[garmentName] ?? [];
            const isCollapsed = collapsed[garmentName];
            // Get garment_id from first category for "Add Group" shortcut
            const firstGarmentId = categories[0]?.garment_id ?? null;

            return (
              <div key={garmentName} className="border border-border rounded-2xl overflow-hidden shadow-xs">
                {/* Garment Section Header */}
                <div
                  className="flex items-center justify-between px-5 py-3 bg-muted/40 cursor-pointer select-none"
                  onClick={() => setCollapsed((p) => ({ ...p, [garmentName]: !p[garmentName] }))}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{garmentName}</span>
                    <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {categories.length} group{categories.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => openCategoryDialog({ mode: "add", garmentId: firstGarmentId })}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Group
                    </Button>
                    {isCollapsed ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Categories */}
                {!isCollapsed && (
                  <div className="divide-y divide-border">
                    {categories.map((category) => (
                      <div key={category.id} className="p-5">
                        {/* Category Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm text-foreground">{category.name}</h4>
                            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              {category.options.length} option{category.options.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() =>
                                openOptionDialog({
                                  mode: "add",
                                  categoryId: category.id,
                                  categoryName: category.name,
                                })
                              }
                            >
                              <Plus className="h-3 w-3 mr-1" /> Add Option
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => openCategoryDialog({ mode: "edit", category })}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 hover:text-destructive"
                              onClick={() =>
                                setDeleteDialog({ type: "category", id: category.id, name: category.name })
                              }
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Options Grid */}
                        {category.options.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">
                            No options yet. Click "Add Option" to add one.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {category.options.map((opt) => (
                              <div
                                key={opt.id}
                                className="group flex items-center gap-2 border border-border bg-card rounded-lg px-3 py-2 hover:border-primary/40 transition-colors"
                              >
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-semibold text-foreground">{opt.name}</span>
                                  {Number(opt.price_modifier) > 0 && (
                                    <span className="text-[10px] text-emerald-600 font-semibold">
                                      ₹{Number(opt.price_modifier).toLocaleString("en-IN")}
                                    </span>
                                  )}
                                  {Number(opt.price_modifier) === 0 && (
                                    <span className="text-[10px] text-muted-foreground">No extra charge</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                    onClick={() =>
                                      openOptionDialog({
                                        mode: "edit",
                                        option: opt,
                                        categoryName: category.name,
                                      })
                                    }
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                                    onClick={() =>
                                      setDeleteDialog({ type: "option", id: opt.id, name: opt.name })
                                    }
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Category Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={categoryDialog !== null}
        onOpenChange={(o) => { if (!o) setCategoryDialog(null); }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {categoryDialog?.mode === "edit" ? "Edit Group" : "Add Customisation Group"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Garment Category</Label>
              <Select
                value={catGarmentId}
                onValueChange={setCatGarmentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select garment…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— General (no garment) —</SelectItem>
                  {garmentsList.map((g: any) => (
                    <SelectItem key={g.id} value={g.id.toString()}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Group Name</Label>
              <Input
                placeholder="e.g. Collar, Cuffs, Pocket…"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveCategory()}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sort Order</Label>
              <Input
                type="number"
                min="0"
                value={catSortOrder}
                onChange={(e) => setCatSortOrder(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCategoryDialog(null)}>Cancel</Button>
            <Button
              onClick={handleSaveCategory}
              disabled={!catName.trim() || createCatMutation.isPending || updateCatMutation.isPending}
            >
              {categoryDialog?.mode === "edit" ? "Save Changes" : "Add Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Option Dialog ───────────────────────────────────────────── */}
      <Dialog
        open={optionDialog !== null}
        onOpenChange={(o) => { if (!o) setOptionDialog(null); }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {optionDialog?.mode === "edit" ? "Edit Option" : `Add Option — ${optionDialog?.categoryName}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Option Name</Label>
              <Input
                placeholder="e.g. Button Down, Mandarin…"
                value={optName}
                onChange={(e) => setOptName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveOption()}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Price (₹)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  className="pl-7"
                  value={optPrice}
                  onChange={(e) => setOptPrice(e.target.value)}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Leave 0 if this option has no extra charge.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Sort Order</Label>
              <Input
                type="number"
                min="0"
                value={optSortOrder}
                onChange={(e) => setOptSortOrder(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOptionDialog(null)}>Cancel</Button>
            <Button
              onClick={handleSaveOption}
              disabled={!optName.trim() || createOptMutation.isPending || updateOptMutation.isPending}
            >
              {optionDialog?.mode === "edit" ? "Save Changes" : "Add Option"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ─────────────────────────────────────── */}
      <AlertDialog
        open={deleteDialog !== null}
        onOpenChange={(o) => { if (!o) setDeleteDialog(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteDialog?.type === "category" ? "Group" : "Option"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog?.type === "category"
                ? `Deleting "${deleteDialog?.name}" will also delete all options inside it. This cannot be undone.`
                : `Are you sure you want to delete the option "${deleteDialog?.name}"? This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

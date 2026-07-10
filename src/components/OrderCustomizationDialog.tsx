import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { listCustomizations } from "@/services/customizations";
import { resolvePublicUrl } from "@/services/api";

interface OrderCustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOptions: Record<number, { priceModifier: number, note: string }>; // optionId -> { priceModifier, note }
  onSelectionChange: (selections: Record<number, { priceModifier: number, note: string }>) => void;
}

export function OrderCustomizationDialog({ open, onOpenChange, selectedOptions, onSelectionChange }: OrderCustomizationDialogProps) {
  const { data: groupedData, isLoading } = useQuery({
    queryKey: ["customizations"],
    queryFn: listCustomizations,
  });

  const [localSelections, setLocalSelections] = useState<Record<number, { optionId: number, priceModifier: number, note: string }>>({});

  // Sync local state when opened
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      // Need to re-map selectedOptions back to categories.
      // Wait, we do this in useMemo, so we just clear or let useMemo handle it.
    }
    onOpenChange(isOpen);
  };

  const handleSelect = (categoryId: number, optionId: number, priceModifier: number) => {
    setLocalSelections((prev) => {
      const next = { ...prev };
      const prevSel = prev[categoryId] as any;
      const keepNote = prevSel?.optionId === optionId ? prevSel.note : "";
      return { ...next, [categoryId]: { optionId, priceModifier, note: keepNote } };
    });
  };

  const save = () => {
    const finalSelections: Record<number, { priceModifier: number, note: string }> = {};
    Object.values(localSelections).forEach((sel: any) => {
      finalSelections[sel.optionId] = { priceModifier: sel.priceModifier, note: sel.note || "" };
    });
    onSelectionChange(finalSelections);
    onOpenChange(false);
  };

  // Convert selectedOptions to categoryId map for initial state
  useMemo(() => {
    if (!groupedData) return;
    if (!open) return; // Only sync when open to prevent wiping notes accidentally
    const catMap: Record<number, any> = {};
    Object.values(groupedData).forEach((categories) => {
      categories.forEach((cat) => {
        cat.options.forEach((opt) => {
          if (selectedOptions[opt.id] !== undefined) {
            catMap[cat.id] = { 
              optionId: opt.id, 
              priceModifier: selectedOptions[opt.id].priceModifier, 
              note: selectedOptions[opt.id].note 
            };
          }
        });
      });
    });
    setLocalSelections(catMap);
  }, [groupedData, selectedOptions, open]);

  const garments = Object.keys(groupedData ?? {});

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle>Advance Customisation</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading...</div>
        ) : (
          <Tabs defaultValue={garments[0]} className="flex-1 flex flex-col min-h-0">
            <div className="px-6 pt-2">
              <TabsList className="mb-4">
                {garments.map((g) => (
                  <TabsTrigger key={g} value={g} className="capitalize">{g}</TabsTrigger>
                ))}
              </TabsList>
            </div>

            <ScrollArea className="flex-1 px-6">
              {garments.map((g) => (
                <TabsContent key={g} value={g} className="m-0 space-y-8 pb-8">
                  {groupedData?.[g]?.map((category) => (
                    <div key={category.id}>
                      <h3 className="text-sm font-semibold mb-3">{category.name}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {category.options.map((opt) => {
                          const isSelected = (localSelections[category.id] as any)?.optionId === opt.id;
                          const priceNum = Number(opt.price_modifier);
                          
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSelect(category.id, opt.id, priceNum)}
                              className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg border text-xs font-medium transition-all ${
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground shadow-sm font-semibold"
                                  : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted/50"
                              }`}
                            >
                              <span className="text-center w-full truncate leading-tight">
                                {opt.name}
                              </span>
                              {priceNum > 0 && (
                                <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                  +${priceNum.toFixed(2)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </TabsContent>
              ))}
            </ScrollArea>
          </Tabs>
        )}

        <div className="p-4 border-t flex justify-end gap-2 bg-muted/20">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Save Customisations</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

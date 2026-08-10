import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      <DialogContent className="max-w-5xl w-[95vw] sm:w-full h-[90vh] lg:h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl lg:rounded-xl bg-card border-border">
        <DialogTitle className="sr-only">Advance Customisation</DialogTitle>
        
        {/* DESKTOP UI */}
        <div className="hidden lg:flex flex-col h-full min-h-0">
          <DialogHeader className="p-6 pb-2 border-b shrink-0">
            <h2 className="text-lg font-bold">Advance Customisation</h2>
          </DialogHeader>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading...</div>
          ) : (
            <Tabs defaultValue={garments[0]} className="flex-1 flex flex-col min-h-0">
              <div className="px-6 pt-2 shrink-0">
                <TabsList className="mb-4">
                  {garments.map((g) => (
                    <TabsTrigger key={g} value={g}>
                      {g.toLowerCase() === "shirt" ? "Shirt/Kurta" : g.charAt(0).toUpperCase() + g.slice(1)}
                    </TabsTrigger>
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
                                  <span className={`text-[9px] mt-0.5 font-semibold ${isSelected ? 'text-primary-foreground/80' : 'text-emerald-600'}`}>
                                    ₹{priceNum.toLocaleString("en-IN")}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        {(() => {
                          const selectedOptionId = (localSelections[category.id] as any)?.optionId;
                          if (!selectedOptionId) return null;
                          const selectedOption = category.options.find(o => o.id === selectedOptionId);
                          if (selectedOption?.requires_note) {
                            return (
                              <div className="mt-3">
                                <Input 
                                  placeholder={`Add note for ${selectedOption.name}...`}
                                  value={(localSelections[category.id] as any)?.note || ""}
                                  onChange={(e) => {
                                    const newNote = e.target.value;
                                    setLocalSelections(prev => ({
                                      ...prev,
                                      [category.id]: {
                                        ...(prev[category.id] as any),
                                        note: newNote
                                      }
                                    }));
                                  }}
                                />
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    ))}
                  </TabsContent>
                ))}
              </ScrollArea>
            </Tabs>
          )}

          <div className="p-4 border-t flex justify-end gap-2 bg-muted/20 shrink-0">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={save}>Save Customisations</Button>
          </div>
        </div>

        {/* MOBILE UI */}
        <div className="flex lg:hidden flex-col h-full bg-white min-h-0">
          <div className="px-5 py-4 border-b border-border/50 sticky top-0 bg-white z-10 flex items-center justify-between shrink-0">
            <h2 className="text-xl font-extrabold text-foreground">Advance Customisation</h2>
          </div>
          
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading...</div>
          ) : (
            <Tabs defaultValue={garments[0]} className="flex-1 flex flex-col min-h-0">
              <div className="px-4 pt-3 shrink-0">
                <TabsList className="mb-2 w-full h-auto flex flex-wrap bg-transparent justify-start gap-2 p-0">
                  {garments.map((g) => (
                    <TabsTrigger 
                      key={g} 
                      value={g} 
                      className="rounded-full border border-border data-[state=active]:bg-[#4A2B15] data-[state=active]:text-white px-4 py-1.5 text-sm"
                    >
                      {g.toLowerCase() === "shirt" ? "Shirt/Kurta" : g.charAt(0).toUpperCase() + g.slice(1)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <ScrollArea className="flex-1 px-4">
                {garments.map((g) => (
                  <TabsContent key={g} value={g} className="m-0 space-y-6 pb-6 mt-2">
                    {groupedData?.[g]?.map((category) => (
                      <div key={category.id} className="space-y-3">
                        <h3 className="text-base font-bold text-foreground">{category.name}</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {category.options.map((opt) => {
                            const isSelected = (localSelections[category.id] as any)?.optionId === opt.id;
                            const priceNum = Number(opt.price_modifier);
                            
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleSelect(category.id, opt.id, priceNum)}
                                className={`flex flex-col items-center justify-center px-3 py-3 rounded-xl border text-sm font-medium transition-all ${
                                  isSelected
                                    ? "border-[#4A2B15] bg-[#4A2B15]/5 text-[#4A2B15] shadow-sm font-bold ring-1 ring-[#4A2B15]/20"
                                    : "border-border bg-white text-foreground hover:bg-muted/30"
                                }`}
                              >
                                <span className="text-center w-full truncate leading-tight">
                                  {opt.name}
                                </span>
                                {priceNum > 0 && (
                                  <span className={`text-[10px] mt-1 font-bold ${isSelected ? 'text-[#4A2B15]' : 'text-emerald-600'}`}>
                                    ₹{priceNum.toLocaleString("en-IN")}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        {(() => {
                          const selectedOptionId = (localSelections[category.id] as any)?.optionId;
                          if (!selectedOptionId) return null;
                          const selectedOption = category.options.find(o => o.id === selectedOptionId);
                          if (selectedOption?.requires_note) {
                            return (
                              <div className="mt-3 pt-2 border-t border-dashed">
                                <label className="text-xs text-muted-foreground font-semibold mb-1 block">Note for {selectedOption.name}</label>
                                <Input 
                                  placeholder="Enter note..."
                                  value={(localSelections[category.id] as any)?.note || ""}
                                  onChange={(e) => {
                                    const newNote = e.target.value;
                                    setLocalSelections(prev => ({
                                      ...prev,
                                      [category.id]: {
                                        ...(prev[category.id] as any),
                                        note: newNote
                                      }
                                    }));
                                  }}
                                  className="h-12 border-border text-sm rounded-xl shadow-sm bg-white"
                                />
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    ))}
                  </TabsContent>
                ))}
              </ScrollArea>
            </Tabs>
          )}

          <div className="p-4 pt-3 space-y-3 shrink-0 border-t border-border/50 bg-white">
            <Button onClick={save} className="w-full h-14 bg-[#4A2B15] hover:bg-[#4A2B15]/90 text-white rounded-xl text-lg font-bold shadow-md">
              Save
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full h-14 border-border text-foreground rounded-xl text-lg font-bold bg-muted/20">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

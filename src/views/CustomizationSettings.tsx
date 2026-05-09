import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import { listCustomizations } from "@/services/customizations";
import { resolvePublicUrl } from "@/services/api";

export default function CustomizationSettings() {
  const { data: groupedData, isLoading } = useQuery({
    queryKey: ["customizations"],
    queryFn: listCustomizations,
  });

  const garments = Object.keys(groupedData ?? {});

  return (
    <div>
      <PageHeader
        title="Customisation Settings"
        subtitle="Manage categories and options for orders"
        backTo="/orders"
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add Category
          </Button>
        }
      />

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : garments.length === 0 ? (
        <div className="text-sm text-muted-foreground">No customisations found.</div>
      ) : (
        <div className="space-y-8">
          {garments.map((g) => (
            <SectionCard key={g} title={`Garment: ${g.charAt(0).toUpperCase() + g.slice(1)}`}>
              <div className="space-y-6">
                {groupedData?.[g]?.map((category) => (
                  <div key={category.id} className="border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">{category.name}</h4>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-1" /> Add Option
                      </Button>
                    </div>
                    
                    {category.options.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No options.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        {category.options.map((opt) => (
                          <div key={opt.id} className="flex flex-col items-center p-2 rounded-xl border border-border bg-card">
                            <div className="w-full aspect-square bg-white rounded-lg mb-2 overflow-hidden flex items-center justify-center p-1">
                              {opt.image_path ? (
                                <img src={resolvePublicUrl(opt.image_path)!} alt={opt.name} className="w-full h-full object-contain mix-blend-multiply" />
                              ) : (
                                <span className="text-muted-foreground text-xs">No img</span>
                              )}
                            </div>
                            <span className="text-xs font-medium text-center w-full truncate leading-tight">
                              {opt.name}
                            </span>
                            {Number(opt.price_modifier) > 0 && (
                              <span className="text-[10px] text-muted-foreground mt-0.5">
                                +${Number(opt.price_modifier).toFixed(2)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}

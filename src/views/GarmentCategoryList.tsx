import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { fetchGarments, createGarment, updateGarment, deleteGarment, Garment } from "@/services/inventory";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function GarmentCategoryList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGarment, setEditingGarment] = useState<Garment | null>(null);
  
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { data: garments, isLoading } = useQuery({
    queryKey: ["garments"],
    queryFn: fetchGarments,
  });

  const resetForm = () => {
    setName("");
    setImageFile(null);
    setEditingGarment(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (g: Garment) => {
    resetForm();
    setEditingGarment(g);
    setName(g.name);
    setDialogOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: createGarment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["garments"] });
      toast({ title: "Success", description: "Garment category created successfully." });
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to create garment.", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: FormData }) => updateGarment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["garments"] });
      toast({ title: "Success", description: "Garment category updated successfully." });
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to update garment.", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGarment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["garments"] });
      toast({ title: "Success", description: "Garment category deleted." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to delete garment.", variant: "destructive" });
    }
  });

  const handleSubmit = () => {
    if (!name) {
      toast({ title: "Validation Error", description: "Name is required.", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    if (imageFile) {
      formData.append("image_file", imageFile);
    }

    if (editingGarment) {
      updateMutation.mutate({ id: editingGarment.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Garment Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage garment types and their category images.</p>
        </div>
        <Button onClick={openAddDialog} className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
                  <th className="p-4">Image</th>
                  <th className="p-4">Name</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {garments?.map((g) => (
                  <tr key={g.id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4">
                      <div className="h-12 w-12 rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                        {g.image_path ? (
                          <img src={`${apiBaseUrl}/storage/${g.image_path}`} alt={g.name} className="h-full w-full object-contain p-1" />
                        ) : (
                          <span className="text-muted-foreground text-xs">No img</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-foreground">{g.name}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(g)}>
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => {
                          if (window.confirm("Are you sure you want to delete this garment category?")) {
                            deleteMutation.mutate(g.id);
                          }
                        }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {garments?.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-muted-foreground">
                      No garment categories found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingGarment ? "Edit Garment Category" : "Add Garment Category"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Co-ord Set"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Category Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setImageFile(e.target.files[0]);
                  } else {
                    setImageFile(null);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">Upload a square image (preferably .webp or .png) for the garment icon.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

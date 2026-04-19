import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Plus, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { apiRequest } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function RoleList() {
  const queryClient = useQueryClient();
  const { data: roles, isLoading } = useQuery({
    queryKey: ["roles-full"],
    queryFn: () => apiRequest<any[]>("/api/roles"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/roles/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles-full"] });
      toast.success("Role deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete role");
    }
  });

  const handleDelete = (id: number, name: string) => {
    if (name === "Admin") return toast.error("Cannot delete Admin role");
    if (confirm(`Are you sure you want to delete the "${name}" role? This will affect all users assigned to this role.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground">Define what each team member can see and do.</p>
        </div>
        <Link to="/settings/roles/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Role
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">Loading roles...</div>
        ) : (roles || []).map((role: any) => (
          <div key={role.id} className="bg-card rounded-xl border p-6 flex flex-col justify-between card-shadow hover:ring-2 hover:ring-primary/20 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-lg">{role.role_name}</h3>
                </div>
                <Badge variant={role.status === 1 ? "default" : "secondary"}>
                  {role.status === 1 ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2">{role.description || "No description provided."}</p>
              
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Permissions</div>
                <div className="flex flex-wrap gap-1.5">
                  {(role.permissions || []).slice(0, 5).map((p: any) => (
                    <Badge key={p.id} variant="secondary" className="px-1.5 py-0 text-[10px] bg-muted/50 border-none">
                      {p.permission_name.replace('manage_', '').replace('view_', '')}
                    </Badge>
                  ))}
                  {(role.permissions || []).length > 5 && (
                    <span className="text-[10px] text-muted-foreground font-medium">
                      +{(role.permissions || []).length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/settings/roles/edit/${role.id}`} className="flex items-center gap-1.5">
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </Link>
              </Button>
              {role.role_name !== "Admin" && (
                <Button variant="ghost" size="sm" onClick={() => handleDelete(role.id, role.role_name)} className="text-destructive hover:text-destructive hover:bg-destructive/10 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

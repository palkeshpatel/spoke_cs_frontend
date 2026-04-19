import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, ArrowLeft, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/services/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function RoleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    role_name: "",
    description: "",
  });
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  // Fetch all permissions
  const { data: allPermissions, isLoading: isPermsLoading } = useQuery({
    queryKey: ["all-permissions"],
    queryFn: () => apiRequest<any[]>("/api/permissions"),
  });

  // Fetch role data if editing
  const { data: roleData, isLoading: isRoleLoading } = useQuery({
    queryKey: ["role", id],
    queryFn: () => apiRequest<any>(`/api/roles/${id}`),
    enabled: isEdit,
  });

  useEffect(() => {
    if (roleData) {
      setFormData({
        role_name: roleData.role_name,
        description: roleData.description || "",
      });
      setSelectedPermissions(roleData.permissions?.map((p: any) => p.id) || []);
    }
  }, [roleData]);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const payload = { ...formData, permissions: selectedPermissions };
      if (isEdit) {
        return apiRequest(`/api/roles/${id}`, { method: "PUT", body: payload });
      }
      return apiRequest("/api/roles", { method: "POST", body: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles-full"] });
      toast.success(isEdit ? "Role updated" : "New role created");
      navigate("/settings/roles");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save role");
    }
  });

  const togglePermission = (permId: number) => {
    if (roleData?.role_name === "Admin") return; // Admin should stay admin
    setSelectedPermissions(prev => 
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  // Group permissions by module
  const groupedPermissions = allPermissions?.reduce((acc: any, curr: any) => {
    const mod = curr.module || 'Other';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(curr);
    return acc;
  }, {}) || {};

  if (isPermsLoading || (isEdit && isRoleLoading)) {
    return <div className="p-12 text-center text-muted-foreground">Loading role editor...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/settings/roles")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isEdit ? `Edit Role: ${roleData?.role_name}` : "Create New Role"}</h1>
          <p className="text-muted-foreground text-sm">Configure permissions and access levels.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card rounded-xl border p-6 space-y-4 card-shadow">
            <h2 className="font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" /> Role Details
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Role Name</label>
                <input
                  required
                  disabled={roleData?.role_name === "Admin"}
                  className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  value={formData.role_name}
                  onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                  placeholder="e.g., Senior Tailor"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none min-h-[100px]"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What can this role do?"
                />
              </div>
            </div>
            
            <div className="pt-4">
              <Button 
                onClick={() => mutation.mutate({})} 
                disabled={mutation.isPending || roleData?.role_name === "Admin" && isEdit} 
                className="w-full"
              >
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Role
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Permission Matrix */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border overflow-hidden card-shadow">
            <div className="p-4 bg-muted/50 border-b flex items-center justify-between">
              <h2 className="font-semibold px-2">Permission Matrix</h2>
              {roleData?.role_name === "Admin" && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                  Full System Access
                </span>
              )}
            </div>
            
            <div className="p-6 space-y-8">
              {Object.entries(groupedPermissions).map(([module, perms]: [string, any]) => (
                <div key={module} className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary/70 px-2 italic border-l-2 border-primary/20">
                    {module} Module
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {perms.map((perm: any) => (
                      <div 
                        key={perm.id} 
                        onClick={() => togglePermission(perm.id)}
                        className={`
                          p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between group
                          ${selectedPermissions.includes(perm.id) 
                            ? 'border-primary bg-primary/5' 
                            : 'border-transparent bg-muted/30 hover:bg-muted/60'}
                        `}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-bold group-hover:text-primary transition-colors">
                            {perm.permission_name.replace('manage_', '').replace('view_', '').replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-[10px] text-muted-foreground leading-tight">
                            {perm.description || `Grants access to ${module.toLowerCase()} functionality.`}
                          </span>
                        </div>
                        {selectedPermissions.includes(perm.id) && (
                          <CheckCircle2 className="w-5 h-5 text-primary animate-in zoom-in duration-200" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

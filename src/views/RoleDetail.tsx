import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Save,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Shield,
  Lock,
  Key,
  Users,
  Info,
} from "lucide-react";
import { apiRequest } from "@/services/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function RoleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({ role_name: "", description: "" });
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  const { data: allPermissions, isLoading: isPermsLoading } = useQuery({
    queryKey: ["all-permissions"],
    queryFn: () => apiRequest<any[]>("/api/permissions"),
  });

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
    mutationFn: () => {
      const payload = { ...formData, permissions: selectedPermissions };
      if (isEdit)
        return apiRequest(`/api/roles/${id}`, { method: "PUT", body: payload });
      return apiRequest("/api/roles", { method: "POST", body: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles-full"] });
      toast.success(isEdit ? "Role updated successfully" : "New role created");
      navigate("/settings/roles");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save role");
    },
  });

  const isAdmin = roleData?.role_name === "Admin";

  const togglePermission = (permId: number) => {
    if (isAdmin) return;
    setSelectedPermissions((prev) =>
      prev.includes(permId)
        ? prev.filter((p) => p !== permId)
        : [...prev, permId],
    );
  };

  const groupedPermissions =
    allPermissions?.reduce((acc: any, curr: any) => {
      const mod = curr.module || "Other";
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(curr);
      return acc;
    }, {}) || {};

  const totalPermissions = allPermissions?.length ?? 0;
  const selectedCount = selectedPermissions.length;
  const moduleCount = Object.keys(groupedPermissions).length;

  if (isPermsLoading || (isEdit && isRoleLoading)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Loading role editor…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-start gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/settings/roles")}
          className="mt-0.5 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold truncate">
              {isEdit ? `Edit Role: ${roleData?.role_name}` : "Create New Role"}
            </h1>
            {isAdmin && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1 rounded-full">
                <Shield className="w-3 h-3" />
                Full System Access
              </span>
            )}
            {!isAdmin && isEdit && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full">
                <Key className="w-3 h-3" />
                Custom Role
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            Configure role details and assign permissions across modules.
          </p>
        </div>

        <Button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || (isAdmin && isEdit)}
          className="hidden sm:flex items-center gap-2 px-6 shrink-0"
        >
          {mutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {mutation.isPending ? "Saving…" : "Save Role"}
        </Button>
      </div>

      {/* ── Two-column Layout ── */}
      <div className="flex gap-6 items-start">
        {/* ── Left Sidebar (Sticky) ── */}
        <aside className="w-80 shrink-0 sticky top-6 space-y-4">
          {/* Role Details Card */}
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/40">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Role Details</span>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Role Name
                </label>
                <input
                  required
                  disabled={isAdmin}
                  className="w-full bg-background border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  value={formData.role_name}
                  onChange={(e) =>
                    setFormData({ ...formData, role_name: e.target.value })
                  }
                  placeholder="e.g., Senior Tailor"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  disabled={isAdmin}
                  className="w-full bg-background border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none min-h-[100px] resize-none disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="What can this role do?"
                />
              </div>
            </div>
          </div>

          {/* Permission Summary Card */}
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/40">
              <Lock className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Permission Summary</span>
            </div>
            <div className="p-4 space-y-1">
              {/* Stat rows */}
              {[
                {
                  label: "Permissions",
                  value: (
                    <span className="font-bold text-primary text-sm">
                      {selectedCount}
                      <span className="text-muted-foreground font-normal text-xs">
                        {" "}
                        / {totalPermissions}
                      </span>
                    </span>
                  ),
                },
                {
                  label: "Modules Covered",
                  value: (
                    <span className="font-bold text-sm">{moduleCount}</span>
                  ),
                },
                {
                  label: "Access Level",
                  value: (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isAdmin
                          ? "bg-amber-100 text-amber-800"
                          : selectedCount === totalPermissions
                            ? "bg-green-100 text-green-800"
                            : selectedCount === 0
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {isAdmin
                        ? "Full Access"
                        : selectedCount === totalPermissions
                          ? "Full Access"
                          : selectedCount === 0
                            ? "No Access"
                            : "Partial Access"}
                    </span>
                  ),
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-2.5 border-b border-dashed last:border-0"
                >
                  <span className="text-xs text-muted-foreground">{label}</span>
                  {value}
                </div>
              ))}

              {/* Progress bar */}
              <div className="pt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-muted-foreground">
                    Coverage
                  </span>
                  <span className="text-[10px] font-semibold text-primary">
                    {totalPermissions > 0
                      ? `${Math.round((selectedCount / totalPermissions) * 100)}%`
                      : "0%"}
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{
                      width:
                        totalPermissions > 0
                          ? `${(selectedCount / totalPermissions) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Admin Lock Notice */}
          {isAdmin && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                The <strong>Admin</strong> role has full system access and
                cannot be modified.
              </p>
            </div>
          )}

          {/* Save Button */}
          <div className="bg-card rounded-xl border shadow-sm p-4 space-y-2">
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || (isAdmin && isEdit)}
              className="w-full gap-2"
              size="lg"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {mutation.isPending ? "Saving…" : "Save Role"}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              Changes apply immediately after saving.
            </p>
          </div>
        </aside>

        {/* ── Permission Matrix ── */}
        <div className="flex-1 min-w-0 bg-card rounded-xl border shadow-sm overflow-hidden">
          {/* Matrix Header */}
          <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary shrink-0" />
              <div>
                <h2 className="font-bold text-base leading-tight">
                  Permission Matrix
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isAdmin
                    ? "All permissions granted"
                    : "Click a permission card to toggle access"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!isAdmin && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() =>
                      setSelectedPermissions(
                        allPermissions?.map((p: any) => p.id) ?? [],
                      )
                    }
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => setSelectedPermissions([])}
                  >
                    Clear All
                  </Button>
                </>
              )}
              {isAdmin && (
                <span className="text-xs font-bold uppercase tracking-widest bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-full">
                  Full System Access
                </span>
              )}
            </div>
          </div>

          {/* Module sections */}
          <div className="p-6 space-y-8">
            {Object.entries(groupedPermissions).map(
              ([module, perms]: [string, any]) => {
                const moduleSelected = perms.filter((p: any) =>
                  selectedPermissions.includes(p.id),
                ).length;

                return (
                  <div key={module}>
                    {/* Module Header Row */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs font-bold uppercase tracking-widest text-primary whitespace-nowrap">
                        {module} Module
                      </span>
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground font-medium shrink-0">
                        {moduleSelected} / {perms.length} selected
                      </span>
                    </div>

                    {/* Permission Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {perms.map((perm: any) => {
                        const isSelected = selectedPermissions.includes(
                          perm.id,
                        );
                        return (
                          <div
                            key={perm.id}
                            onClick={() => togglePermission(perm.id)}
                            className={[
                              "group relative rounded-xl border-2 p-4 transition-all duration-150 select-none",
                              isAdmin ? "cursor-default" : "cursor-pointer",
                              isSelected
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border bg-background hover:border-primary/40 hover:bg-muted/30",
                            ].join(" ")}
                          >
                            {/* Left active strip */}
                            {isSelected && (
                              <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-primary rounded-r-full" />
                            )}

                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm font-bold leading-tight transition-colors ${
                                    isSelected
                                      ? "text-primary"
                                      : "text-foreground group-hover:text-primary"
                                  }`}
                                >
                                  {perm.permission_name
                                    .replace("manage_", "")
                                    .replace("view_", "")
                                    .replace(/_/g, " ")
                                    .toUpperCase()}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                  {perm.description ||
                                    `Grants access to ${module.toLowerCase()} functionality.`}
                                </p>
                              </div>

                              {/* Toggle circle */}
                              <div
                                className={`shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                  isSelected
                                    ? "border-primary bg-primary"
                                    : "border-muted-foreground/30 group-hover:border-primary/60"
                                }`}
                              >
                                {isSelected && (
                                  <CheckCircle2 className="w-4 h-4 text-white" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              },
            )}

            {Object.keys(groupedPermissions).length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                <Shield className="w-12 h-12 opacity-20" />
                <p className="text-sm font-medium">No permissions found</p>
                <p className="text-xs">
                  Permissions will appear here once loaded from the server.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

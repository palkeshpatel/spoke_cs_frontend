import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, UserCog, Trash2, Mail, Shield, LayoutGrid, List, Search, Phone, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { getStaff, deleteStaff } from "@/services/staff";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { resolvePublicUrl } from "@/services/api";

export default function StaffList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");

  const { data: staff, isLoading } = useQuery({
    queryKey: ["staff-list"],
    queryFn: getStaff,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-list"] });
      toast.success("Staff member removed");
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to remove this staff member?")) {
      deleteMutation.mutate(id);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = staff || [];
    if (!q) return list;
    return list.filter((s: any) => {
      const name = (s.name || "").toLowerCase();
      const email = (s.email || "").toLowerCase();
      const role = (s.role_record?.role_name || s.role || "").toLowerCase();
      return name.includes(q) || email.includes(q) || role.includes(q);
    });
  }, [staff, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Management"
        subtitle={`${filtered.length} staff members`}
        actions={
          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              value={view}
              onValueChange={(v) => {
                if (v === "grid" || v === "list") setView(v);
              }}
              variant="outline"
              size="sm"
              className="hidden sm:flex"
            >
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <Button asChild size="sm">
              <Link to="/staff/new">
                <Plus className="h-4 w-4 mr-1" /> Add Staff
              </Link>
            </Button>
          </div>
        }
      />

      <div className="bg-card rounded-xl card-shadow overflow-hidden border border-border">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, email or role..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-9" 
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground animate-pulse mt-4 bg-muted/20 rounded-xl border border-dashed border-border">Loading staff database...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No staff members found matching your search.</div>
        ) : view === "list" ? (
          <div className="divide-y divide-border">
            {filtered.map((s: any) => {
              const roleName = s.role_record?.role_name || s.role || 'Staff';
              const isAdminStaff = roleName.toLowerCase() === 'admin';
              const rowContent = (
                <>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border border-border overflow-hidden bg-muted flex items-center justify-center shrink-0 shadow-sm group-hover:border-primary/50 transition-colors">
                      {s.profile_photo_url || s.profile_photo ? (
                        <img src={resolvePublicUrl(s.profile_photo_url || s.profile_photo)!} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-primary">{s.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{s.name}</span>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Mail className="w-3 h-3" /> {s.email}
                        </span>
                        {s.phone && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Plus className="w-2.5 h-2.5" /> {s.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <Badge variant="secondary" className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      isAdminStaff
                        ? 'bg-muted text-muted-foreground border-border'
                        : 'bg-primary/5 text-primary border-primary/10'
                    }`}>
                      {isAdminStaff ? <Lock className="w-3 h-3 mr-1.5" /> : <Shield className="w-3 h-3 mr-1.5" />}
                      {roleName}
                    </Badge>
                    
                    <div className="flex items-center gap-2 pr-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${s.status ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-red-400'}`} />
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-tight">
                        {s.status ? 'Active' : 'On Leave'}
                      </span>
                    </div>
                  </div>
                </>
              );

              const rowClassName = `flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 transition-all group gap-4 ${
                isAdminStaff ? 'cursor-not-allowed bg-muted/20 opacity-80' : 'cursor-pointer hover:bg-muted/50'
              }`;

              if (isAdminStaff) {
                return (
                  <div key={s.id} className={rowClassName}>
                    {rowContent}
                  </div>
                );
              }

              return (
                <Link
                  key={s.id}
                  to={`/staff/edit/${s.id}`}
                  className={rowClassName}
                >
                  {rowContent}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((s: any) => {
                const roleName = s.role_record?.role_name || s.role || 'Staff';
                const isAdminStaff = roleName.toLowerCase() === 'admin';
                const cardContent = (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-14 h-14 rounded-full border-2 border-border overflow-hidden bg-muted flex items-center justify-center shrink-0 shadow-md group-hover:border-primary transition-all">
                        {s.profile_photo_url || s.profile_photo ? (
                          <img src={resolvePublicUrl(s.profile_photo_url || s.profile_photo)!} alt={s.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl font-bold text-primary">{s.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${s.status ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-400'}`} />
                        <Badge variant="outline" className={`text-[10px] font-bold ${
                          isAdminStaff
                            ? 'border-border bg-muted text-muted-foreground'
                            : 'border-primary/20 bg-primary/5 text-primary'
                        }`}>
                          {isAdminStaff && <Lock className="w-3 h-3 mr-1" />}
                          {roleName}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="font-bold text-foreground text-lg truncate group-hover:text-primary transition-colors">{s.name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" /> <span className="truncate">{s.email}</span>
                      </div>
                      {s.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="w-3.5 h-3.5" /> <span>{s.phone}</span>
                        </div>
                      )}
                    </div>
                  </>
                );

                const cardClassName = `bg-card rounded-xl border border-border p-5 transition-all group relative card-shadow border-t-4 block ${
                  isAdminStaff
                    ? 'border-t-muted cursor-not-allowed opacity-80'
                    : 'border-t-primary/20 cursor-pointer hover:bg-muted/40'
                }`;

                if (isAdminStaff) {
                  return (
                    <div key={s.id} className={cardClassName}>
                      {cardContent}
                    </div>
                  );
                }

                return (
                  <Link
                    key={s.id}
                    to={`/staff/edit/${s.id}`}
                    className={cardClassName}
                  >
                    {cardContent}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

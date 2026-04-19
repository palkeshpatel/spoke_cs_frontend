import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, UserCog, Trash2, Mail, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { getStaff, deleteStaff } from "@/services/staff";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function StaffList() {
  const queryClient = useQueryClient();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">Manage your team members, roles, and access.</p>
        </div>
        <Link to="/staff/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Staff
          </Button>
        </Link>
      </div>

      <div className="bg-card rounded-xl border card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">Loading staff entries...</td></tr>
              ) : (staff || []).map((s: any) => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {s.name.charAt(0)}
                      </div>
                      <span className="font-medium">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                      <Shield className="w-3 h-3" /> {s.role?.role_name || s.role || 'Staff'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {s.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/staff/edit/${s.id}`}><UserCog className="w-4 h-4" /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

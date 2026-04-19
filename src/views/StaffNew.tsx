import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import { getRoles, getStaff, saveStaff } from "@/services/staff";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiRequest } from "@/services/api";

export default function StaffNew() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role_id: "",
  });

  const { data: roles } = useQuery({ queryKey: ["roles"], queryFn: getRoles });
  
  const { data: staffData, isLoading: isStaffLoading } = useQuery({
    queryKey: ["staff", id],
    queryFn: () => apiRequest<any>(`/api/staff/${id}`),
    enabled: isEdit,
  });

  useEffect(() => {
    if (staffData) {
      setFormData({
        name: staffData.name,
        email: staffData.email,
        password: "",
        role_id: staffData.role_id?.toString() || "",
      });
    }
  }, [staffData]);

  const mutation = useMutation({
    mutationFn: saveStaff,
    onSuccess: () => {
      toast.success(isEdit ? "Staff updated" : "Staff added successfully");
      navigate("/staff");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save staff");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ ...formData, id: isEdit ? parseInt(id!) : undefined });
  };

  if (isEdit && isStaffLoading) return <div className="p-12 text-center">Loading staff data...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/staff")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">{isEdit ? "Edit Staff Member" : "Add New Staff Member"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-xl border p-6 space-y-4 card-shadow">
        <div className="space-y-2">
          <label className="text-sm font-medium">Full Name</label>
          <input
            required
            className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Email Address</label>
          <input
            required
            type="email"
            className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@example.com"
          />
        </div>

        {!isEdit && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Initial Password</label>
            <input
              required={!isEdit}
              type="password"
              className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Assigned Role</label>
          <select
            required
            className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
            value={formData.role_id}
            onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
          >
            <option value="">Select a role</option>
            {roles?.map((role: any) => (
              <option key={role.id} value={role.id}>
                {role.role_name}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-4 flex gap-3">
          <Button type="submit" disabled={mutation.isPending} className="flex-1">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {isEdit ? "Update Staff" : "Create Staff Account"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/staff")} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

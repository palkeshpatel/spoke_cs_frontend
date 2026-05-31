import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, ArrowLeft, Loader2, Camera, Shield, User, Mail, Phone, Calendar, Info, Lock, Eye, EyeOff } from "lucide-react";
import { getRoles, saveStaff, uploadStaffProfileImage } from "@/services/staff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { apiRequest } from "@/services/api";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";

function splitLegacyBankDetails(value: string) {
  return value
    .split(/[\n,|/]+/)
    .map((part) =>
      part
        .replace(/^bank\s*name\s*[:\-]?\s*/i, "")
        .replace(/^account\s*(?:no|number)\.?\s*[:\-]?\s*/i, "")
        .replace(/^ifsc\s*[:\-]?\s*/i, "")
        .trim(),
    )
    .filter(Boolean);
}

export default function StaffNew() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const profileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role_id: "",
    phone: "",
    dob: "",
    anniversary_date: "",
    bank_account_details: "",
    bank_name: "",
    account_no: "",
    ifsc: "",
    pan_card: "",
    adhar_card: "",
    salary_amount: "",
    salary_date_range: "",
    profile_photo: null as File | null,
    profile_photo_url: "" as string,
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { data: roles } = useQuery({ queryKey: ["roles"], queryFn: getRoles });
  
  const { data: staffData, isLoading: isStaffLoading } = useQuery({
    queryKey: ["staff", id],
    queryFn: () => apiRequest<any>(`/api/staff/${id}`),
    enabled: isEdit,
  });
  const staffRoleName = staffData?.role_record?.role_name || staffData?.role || "";
  const isAdminStaff = isEdit && staffRoleName.toLowerCase() === "admin";

  useEffect(() => {
    if (staffData) {
      const legacyBankParts = splitLegacyBankDetails(staffData.bank_account_details || "");
      setFormData({
        name: staffData.name,
        email: staffData.email,
        password: "",
        role_id: staffData.role_id?.toString() || "",
        phone: staffData.phone || "",
        dob: staffData.dob || "",
        anniversary_date: staffData.anniversary_date || "",
        bank_account_details: staffData.bank_account_details || "",
        bank_name: staffData.bank_name || legacyBankParts[0] || "",
        account_no: staffData.account_no || legacyBankParts[1] || "",
        ifsc: staffData.ifsc || legacyBankParts[2] || "",
        pan_card: staffData.pan_card || "",
        adhar_card: staffData.adhar_card || "",
        salary_amount: staffData.salary_amount || "",
        salary_date_range: staffData.salary_date_range || "",
        profile_photo: null,
        profile_photo_url: staffData.profile_photo || "",
      });
      if (staffData.profile_photo_url) {
        setPhotoPreview(staffData.profile_photo_url);
      }
    }
  }, [staffData]);

  const mutation = useMutation({
    mutationFn: saveStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-list"] });
      toast.success(isEdit ? "Staff profile updated" : "New staff member registered");
      navigate("/staff");
    },
    onError: (error: any) => {
      toast.error(error.message || "Operation failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdminStaff) {
      toast.error("Admin profile is locked and cannot be changed.");
      return;
    }
    if (!formData.name || !formData.email || (!isEdit && !formData.password) || !formData.role_id) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (formData.password.trim() && formData.password.trim().length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    
    // Prepare data for saving - map profile_photo_url to profile_photo for backend
    const bankAccountDetails = [
      formData.bank_name ? `Bank Name: ${formData.bank_name}` : "",
      formData.account_no ? `Account No: ${formData.account_no}` : "",
      formData.ifsc ? `IFSC: ${formData.ifsc}` : "",
    ].filter(Boolean).join(" | ");

    const payload = {
      ...formData,
      bank_account_details: bankAccountDetails || formData.bank_account_details || null,
      profile_photo: formData.profile_photo_url || null,
      id: isEdit ? parseInt(id!) : undefined,
    };

    if (isEdit && !formData.password.trim()) {
      delete (payload as { password?: string }).password;
    }
    
    mutation.mutate(payload);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isAdminStaff) return;
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // Increased to 5MB since we use chunks
        toast.error("Image too large. Max size is 5MB.");
        return;
      }

      setIsUploading(true);
      try {
        const { profile_photo_url } = await uploadStaffProfileImage(file);
        setFormData({ ...formData, profile_photo: null, profile_photo_url });
        setPhotoPreview(URL.createObjectURL(file));
        toast.success("Image uploaded successfully");
      } catch (error: any) {
        toast.error(error.message || "Upload failed");
      } finally {
        setIsUploading(false);
      }
    }
  };

  if (isEdit && isStaffLoading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Fetching staff details...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader 
        title={isEdit ? "Edit Staff Detail" : "New Staff Registration"} 
        subtitle={isAdminStaff ? "Admin profile is locked and cannot be changed." : isEdit ? `Update profile for ${formData.name}` : "Enter details for the new staff member."} 
        backTo="/staff" 
      />

      <form onSubmit={handleSubmit}>
        {isAdminStaff && (
          <div className="mb-6 rounded-xl border border-border bg-muted/40 p-4 flex items-center gap-3 text-sm text-muted-foreground">
            <Lock className="h-4 w-4 shrink-0" />
            <span>Admin has full system access, so this staff profile is locked from editing.</span>
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          <SectionCard title="Staff Identity">
            <div className="space-y-5">
              <div className="flex flex-col gap-4 items-center sm:flex-row sm:items-start p-4 bg-muted/20 rounded-xl border border-dashed border-border mb-2">
                <div className="w-24 h-24 rounded-full bg-card overflow-hidden flex items-center justify-center shrink-0 border-2 border-border shadow-md relative group">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-muted-foreground" />
                  )}
                  <div 
                    className={`absolute inset-0 bg-black/40 opacity-0 transition-opacity flex items-center justify-center ${
                      isAdminStaff ? 'cursor-not-allowed' : 'cursor-pointer group-hover:opacity-100'
                    }`}
                    onClick={() => profileInputRef.current?.click()}
                  >
                    {isAdminStaff ? <Lock className="h-6 w-6 text-white" /> : <Camera className="h-6 w-6 text-white" />}
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <h4 className="text-sm font-bold text-foreground">Profile Picture</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">Square crop recommended. Supports JPG, PNG. Max 5MB.</p>
                  <Button type="button" variant="outline" size="sm" className="w-fit h-8 text-xs" disabled={isAdminStaff || isUploading} onClick={() => profileInputRef.current?.click()}>
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                        Uploading...
                      </>
                    ) : (
                      formData.profile_photo_url ? "Change Image" : "Choose Image"
                    )}
                  </Button>
                  <input ref={profileInputRef} type="file" accept="image/*" onChange={handleFileChange} disabled={isAdminStaff || isUploading} className="hidden" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">Full Name *</label>
                <Input required disabled={isAdminStaff} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter formal name" className="h-10" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input required disabled={isAdminStaff} type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" className="pl-9 h-10" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">Contact Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input type="tel" disabled={isAdminStaff} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 000-000-0000" className="pl-9 h-10" />
                  </div>
                </div>
              </div>

              {!isEdit ? (
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">System Password *</label>
                  <div className="relative">
                    <Input
                      required
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                      className="h-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">Share this password with the staff member for login.</p>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">Reset Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      disabled={isAdminStaff}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Leave blank to keep current password"
                      className="h-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">Set a new login password if the staff member forgot theirs.</p>
                </div>
              )}
            </div>
          </SectionCard>

          <div className="space-y-4 sm:space-y-6">
            <SectionCard title="Assignment & Role">
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">Designation / Role *</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary" />
                    <select
                      required
                      disabled={isAdminStaff}
                      className="w-full h-10 bg-background border border-input rounded-md pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none appearance-none transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                      value={formData.role_id}
                      onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                    >
                      <option value="">Select organizational role</option>
                      {roles?.map((role: any) => (
                        <option key={role.id} value={role.id}>{role.role_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input type="date" disabled={isAdminStaff} value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className="pl-9 h-10 pr-3 [&::-webkit-calendar-picker-indicator]:hidden" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">Join Anniversary</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input type="date" disabled={isAdminStaff} value={formData.anniversary_date} onChange={(e) => setFormData({ ...formData, anniversary_date: e.target.value })} className="pl-9 h-10 pr-3 [&::-webkit-calendar-picker-indicator]:hidden" />
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            <div className="p-5 bg-primary/5 rounded-xl border border-primary/10 flex gap-4">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-primary">Organizational Tip</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Roles define system access. <strong>Admins</strong> have full control, while <strong>Staff</strong> roles like Tailors are limited to order management and work tracking.
                </p>
              </div>
            </div>
          </div>
        </div>

        <SectionCard title="Additional Details" className="mt-6">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">Bank Name</label>
                <Input disabled={isAdminStaff} value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} placeholder="HDFC Bank" className="h-10" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">Account No</label>
                <Input disabled={isAdminStaff} value={formData.account_no} onChange={(e) => setFormData({ ...formData, account_no: e.target.value })} placeholder="123456789012" className="h-10" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">IFSC</label>
                <Input disabled={isAdminStaff} value={formData.ifsc} onChange={(e) => setFormData({ ...formData, ifsc: e.target.value.toUpperCase() })} placeholder="HDFC0001234" className="h-10 uppercase" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">PAN Card</label>
                <Input disabled={isAdminStaff} value={formData.pan_card} onChange={(e) => setFormData({ ...formData, pan_card: e.target.value })} placeholder="ABCDE1234F" className="h-10" />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">Aadhar Card</label>
                <Input disabled={isAdminStaff} value={formData.adhar_card} onChange={(e) => setFormData({ ...formData, adhar_card: e.target.value })} placeholder="1234 5678 9012" className="h-10" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">Salary Amount</label>
                  <Input disabled={isAdminStaff} value={formData.salary_amount} onChange={(e) => setFormData({ ...formData, salary_amount: e.target.value })} placeholder="e.g. 50000" className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">Salary Date Range</label>
                  <Input disabled={isAdminStaff} value={formData.salary_date_range} onChange={(e) => setFormData({ ...formData, salary_date_range: e.target.value })} placeholder="e.g. 1st-5th of Month" className="h-10" />
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="flex gap-3 justify-end pt-8 border-t border-border mt-8">
          <Button variant="outline" type="button" onClick={() => navigate("/staff")} className="h-11 px-8 rounded-lg">
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending || isAdminStaff} className="h-11 px-10 rounded-lg shadow-lg shadow-primary/20 min-w-[160px]">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {isEdit ? "Update Staff Profile" : "Register Member"}
          </Button>
        </div>
      </form>
    </div>
  );
}

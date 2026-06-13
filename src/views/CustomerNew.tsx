import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { CustomerImageCropDialog } from "@/components/CustomerImageCropDialog";
import { createCustomer, uploadCustomerProfileImage } from "@/services/customers";
import { isValidEmail } from "@/lib/utils";
import { PhoneInput } from "@/components/PhoneInput";
import { DatePickerField } from "@/components/DatePickerField";
import { isValidPhone10, phoneToStorage } from "@/lib/phone";

export default function CustomerNew() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profileInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", birthday: "", preferences: "", notes: "" });
  const [emailInlineError, setEmailInlineError] = useState<string>("");
  const [profileCropOpen, setProfileCropOpen] = useState(false);
  const [profilePickFile, setProfilePickFile] = useState<File | null>(null);
  const [profileBlob, setProfileBlob] = useState<Blob | null>(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(null);
  const update = (key: keyof typeof form, val: string) => {
    if (key === "email") setEmailInlineError("");
    setForm((f) => ({ ...f, [key]: val }));
  };

  const createMutation = useMutation({
    mutationFn: createCustomer,
  });

  const submit = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name required", description: "Please enter customer name.", variant: "destructive" });
      return;
    }
    if (!isValidEmail(form.email)) {
      setEmailInlineError("Please enter a valid email address.");
      toast({ title: "Email required", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (form.phone.trim() && !isValidPhone10(form.phone)) {
      toast({ title: "Invalid phone", description: "Phone must be exactly 10 digits (XXX-XXX-XXXX).", variant: "destructive" });
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        name: form.name.trim(),
        phone: phoneToStorage(form.phone) || null,
        email: form.email.trim(),
        address: form.address.trim() || null,
        birthday: form.birthday.trim() || null,
        preferences: {
          fit_preference: form.preferences.trim() || null,
          favorite_colors: null,
          notes: form.notes.trim() || null,
        },
      });

      if (profileBlob) {
        await uploadCustomerProfileImage({
          customerId: created.id,
          blob: profileBlob,
          fileName: "profile.jpg",
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Customer created", description: `Customer ${created.customer_code} created.` });
      navigate(`/customers/${created.id}`);
    } catch (err: unknown) {
      const emailError =
        typeof err === "object" &&
        err !== null &&
        "details" in err &&
        typeof (err as { details?: unknown }).details === "object" &&
        (err as { details?: any }).details &&
        (err as { details?: any }).details.errors &&
        Array.isArray((err as { details?: any }).details.errors.email) &&
        (err as { details?: any }).details.errors.email[0]
          ? String((err as { details?: any }).details.errors.email[0])
          : "";
      const message =
        typeof err === "object" && err !== null && "message" in err ? String((err as { message?: unknown }).message ?? "") : "";
      if (emailError) setEmailInlineError(emailError);
      toast({ title: "Create failed", description: emailError || message || "Unable to create customer.", variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader title="Add Customer" subtitle="Create a new customer profile" backTo="/customers" />

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <SectionCard title="Customer Information">
          <div className="space-y-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Name *</label><Input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Enter customer name" /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">Phone</label><PhoneInput value={form.phone} onChange={(v) => update('phone', v)} /></div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email *</label>
                <Input
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  placeholder="email@example.com"
                  className={emailInlineError ? "border-destructive focus-visible:ring-destructive" : undefined}
                />
                {emailInlineError ? (
                  <p className="mt-1 text-xs text-destructive">{emailInlineError}</p>
                ) : null}
              </div>
            </div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Address</label><Input value={form.address} onChange={e => update('address', e.target.value)} placeholder="Enter address" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Birth Date</label><DatePickerField value={form.birthday} onChange={(v) => update('birthday', v)} placeholder="Select birth date" /></div>

            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Profile photo</label>
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0 border border-border">
                  {profilePreviewUrl ? (
                    <img src={profilePreviewUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => profileInputRef.current?.click()}>
                    {profileBlob ? "Change photo" : "Upload photo"}
                  </Button>
                  {profileBlob ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-8"
                      onClick={() => {
                        setProfileBlob(null);
                        setProfilePreviewUrl(null);
                      }}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">Optional. Square crop recommended. Max 5MB.</p>
              <input
                ref={profileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  e.target.value = "";
                  if (!file) return;
                  setProfilePickFile(file);
                  setProfileCropOpen(true);
                }}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Preferences">
          <div className="space-y-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Fit Preferences</label><Input value={form.preferences} onChange={e => update('preferences', e.target.value)} placeholder="e.g. Slim Fit, Navy colors" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Notes</label><Textarea value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Add any notes..." rows={4} /></div>
          </div>
        </SectionCard>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="cancel" onClick={() => navigate('/customers')}>Cancel</Button>
        <Button onClick={() => void submit()} disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating..." : "Create Customer"}
        </Button>
      </div>

      <CustomerImageCropDialog
        open={profileCropOpen}
        onOpenChange={setProfileCropOpen}
        file={profilePickFile}
        title="Crop profile photo"
        aspect={1}
        onConfirm={async (blob) => {
          setProfileBlob(blob);
          setProfilePreviewUrl(URL.createObjectURL(blob));
        }}
      />
    </div>
  );
}

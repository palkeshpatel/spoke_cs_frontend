import { useEffect, useState } from 'react';
import { Shield, ArrowRight, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import EditableField from '@/components/EditableField';
import { getMe } from '@/services/auth';
import { getLoyaltyProgramSettings, updateLoyaltyProgramSettings } from '@/services/loyaltyProgram';
import { toast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    shopName: 'SPOKE Tailoring',
    phone: '+1 234-567-8900',
    email: 'info@spoke-tailoring.com',
    address: '123 Fashion Ave, New York, NY 10001',
    currency: 'USD',
    timezone: 'America/New_York',
    businessHours: '9:00 AM - 6:00 PM',
  });

  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: ['me'], queryFn: getMe });
  const roleData = meQuery.data?.user?.role_record || meQuery.data?.user?.roleRecord;
  const roleName = (roleData?.role_name || (typeof meQuery.data?.user?.role === 'string' ? meQuery.data?.user?.role : 'staff')).toLowerCase();
  const isAdmin = roleName === 'admin';

  const loyaltyQuery = useQuery({
    queryKey: ['loyalty-program'],
    queryFn: getLoyaltyProgramSettings,
    enabled: isAdmin,
  });

  const [loyaltyEditing, setLoyaltyEditing] = useState(false);
  const [loyaltyForm, setLoyaltyForm] = useState({
    earnAmount: '100',
    earnPoints: '1',
    minRedeemPoints: '3000',
  });

  useEffect(() => {
    if (!loyaltyQuery.data) return;
    setLoyaltyForm({
      earnAmount: String(loyaltyQuery.data.earn_amount ?? 100),
      earnPoints: String(loyaltyQuery.data.earn_points ?? 1),
      minRedeemPoints: String(loyaltyQuery.data.min_redeem_points ?? 3000),
    });
  }, [loyaltyQuery.data]);

  const saveLoyaltyMutation = useMutation({
    mutationFn: async () => {
      const earn_amount = Number(loyaltyForm.earnAmount || 0);
      const earn_points = Number(loyaltyForm.earnPoints || 0);
      const min_redeem_points = Number(loyaltyForm.minRedeemPoints || 0);
      return updateLoyaltyProgramSettings({ earn_amount, earn_points, min_redeem_points });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['loyalty-program'] });
      toast({ title: 'Saved', description: 'Loyalty program settings updated.' });
      setLoyaltyEditing(false);
    },
    onError: (err: unknown) => {
      const message = typeof err === 'object' && err !== null && 'message' in err ? String((err as { message?: unknown }).message ?? '') : '';
      toast({ title: 'Save failed', description: message || 'Unable to update loyalty settings.', variant: 'destructive' });
    },
  });

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage your shop settings"
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
        onSave={() => setIsEditing(false)}
        onCancel={() => setIsEditing(false)}
      />

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        <SectionCard title="Shop Information" onEdit={!isEditing ? () => setIsEditing(true) : undefined}>
          <div className="space-y-4">
            <EditableField label="Shop Name" value={form.shopName} isEditing={isEditing} onChange={v => update('shopName', v)} />
            <EditableField label="Phone" value={form.phone} isEditing={isEditing} type="phone" onChange={v => update('phone', v)} />
            <EditableField label="Email" value={form.email} isEditing={isEditing} onChange={v => update('email', v)} />
            <EditableField label="Address" value={form.address} isEditing={isEditing} onChange={v => update('address', v)} />
          </div>
        </SectionCard>

        <SectionCard title="Business Settings" onEdit={!isEditing ? () => setIsEditing(true) : undefined}>
          <div className="space-y-4">
            <EditableField label="Currency" value={form.currency} isEditing={isEditing} onChange={v => update('currency', v)} />
            <EditableField label="Timezone" value={form.timezone} isEditing={isEditing} onChange={v => update('timezone', v)} />
            <EditableField label="Business Hours" value={form.businessHours} isEditing={isEditing} onChange={v => update('businessHours', v)} />
          </div>
        </SectionCard>

        <Link to="/settings/roles" className="block col-span-full mt-4">
          <SectionCard title="Access Control" className="hover:ring-2 hover:ring-primary/20 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold">Roles & Permissions</h3>
                  <p className="text-sm text-muted-foreground">Manage user roles and assign specific module permissions.</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </SectionCard>
        </Link>

        {isAdmin ? (
          <div className="col-span-full">
            <SectionCard
              title="Loyalty Program"
              onEdit={!loyaltyEditing ? () => setLoyaltyEditing(true) : undefined}
            >
              {loyaltyQuery.isLoading ? (
                <div className="text-sm text-muted-foreground">Loading loyalty settings…</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Gift className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">
                        Configure how customers earn and redeem loyalty points.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Example: <span className="font-medium">100 Rs = 1 point</span>, redeemable at <span className="font-medium">3000 points</span>.
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <EditableField
                      label="Earn Amount (Rs)"
                      value={loyaltyForm.earnAmount}
                      isEditing={loyaltyEditing}
                      type="number"
                      onChange={(v) => setLoyaltyForm((f) => ({ ...f, earnAmount: v }))}
                    />
                    <EditableField
                      label="Earn Points"
                      value={loyaltyForm.earnPoints}
                      isEditing={loyaltyEditing}
                      type="number"
                      onChange={(v) => setLoyaltyForm((f) => ({ ...f, earnPoints: v }))}
                    />
                    <EditableField
                      label="Min Redeem Points"
                      value={loyaltyForm.minRedeemPoints}
                      isEditing={loyaltyEditing}
                      type="number"
                      onChange={(v) => setLoyaltyForm((f) => ({ ...f, minRedeemPoints: v }))}
                    />
                  </div>

                  {loyaltyEditing ? (
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        className="h-9 px-4 rounded-md border border-border text-sm hover:bg-muted transition-colors"
                        onClick={() => {
                          if (loyaltyQuery.data) {
                            setLoyaltyForm({
                              earnAmount: String(loyaltyQuery.data.earn_amount ?? 100),
                              earnPoints: String(loyaltyQuery.data.earn_points ?? 1),
                              minRedeemPoints: String(loyaltyQuery.data.min_redeem_points ?? 3000),
                            });
                          }
                          setLoyaltyEditing(false);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-95 disabled:opacity-50"
                        disabled={saveLoyaltyMutation.isPending}
                        onClick={() => saveLoyaltyMutation.mutate()}
                      >
                        {saveLoyaltyMutation.isPending ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </SectionCard>
          </div>
        ) : null}
      </div>
    </div>
  );
}

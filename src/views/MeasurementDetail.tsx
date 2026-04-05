import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { measurements } from '@/data/mockData';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import EditableField from '@/components/EditableField';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MeasurementDetail() {
  const { id } = useParams();
  const m = measurements.find(x => x.id === id);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(m || measurements[0]);

  if (!m) return <div className="p-8 text-center text-muted-foreground">Measurement not found</div>;

  return (
    <div>
      <PageHeader
        title={m.customerName}
        subtitle={`Last updated: ${m.lastUpdated}`}
        backTo="/measurements"
        isEditing={isEditing}
        onEdit={() => { setForm(m); setIsEditing(true); }}
        onSave={() => setIsEditing(false)}
        onCancel={() => { setForm(m); setIsEditing(false); }}
      />

      {/* Body Profile */}
      <SectionCard title="Body Profile" className="mb-6" onEdit={!isEditing ? () => setIsEditing(true) : undefined}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <EditableField label="Height" value={form.height} isEditing={isEditing} onChange={v => setForm(f => ({ ...f, height: v }))} />
          <EditableField label="Weight" value={form.weight} isEditing={isEditing} onChange={v => setForm(f => ({ ...f, weight: v }))} />
          <EditableField label="Body Type" value={form.bodyType} isEditing={isEditing} onChange={v => setForm(f => ({ ...f, bodyType: v }))} />
          <EditableField label="Posture" value={form.posture} isEditing={isEditing} onChange={v => setForm(f => ({ ...f, posture: v }))} />
        </div>
      </SectionCard>

      {/* Garment Tabs */}
      <Tabs defaultValue="suit" className="mb-6">
        <TabsList>
          <TabsTrigger value="suit">Suit</TabsTrigger>
          <TabsTrigger value="shirt">Shirt</TabsTrigger>
          <TabsTrigger value="pants">Pants</TabsTrigger>
        </TabsList>

        <TabsContent value="suit">
          <SectionCard title="Suit Measurements" onEdit={!isEditing ? () => setIsEditing(true) : undefined}>
            <div className="flex justify-end mb-4">
              <Button variant="ghost" size="sm"><Copy className="h-3.5 w-3.5 mr-1" /> Copy</Button>
            </div>
            <h4 className="text-sm font-semibold text-primary mb-3">Upper Body</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <EditableField label="Chest" value={form.suit.chest} isEditing={isEditing} unit="inches" type="number" onChange={v => setForm(f => ({ ...f, suit: { ...f.suit, chest: Number(v) } }))} />
              <EditableField label="Waist" value={form.suit.waist} isEditing={isEditing} unit="inches" type="number" onChange={v => setForm(f => ({ ...f, suit: { ...f.suit, waist: Number(v) } }))} />
              <EditableField label="Shoulder Width" value={form.suit.shoulderWidth} isEditing={isEditing} unit="inches" type="number" onChange={v => setForm(f => ({ ...f, suit: { ...f.suit, shoulderWidth: Number(v) } }))} />
              <EditableField label="Sleeve Length" value={form.suit.sleeveLength} isEditing={isEditing} unit="inches" type="number" onChange={v => setForm(f => ({ ...f, suit: { ...f.suit, sleeveLength: Number(v) } }))} />
              <EditableField label="Neck" value={form.suit.neck} isEditing={isEditing} unit="inches" type="number" onChange={v => setForm(f => ({ ...f, suit: { ...f.suit, neck: Number(v) } }))} />
              <EditableField label="Bicep" value={form.suit.bicep} isEditing={isEditing} unit="inches" type="number" onChange={v => setForm(f => ({ ...f, suit: { ...f.suit, bicep: Number(v) } }))} />
              <EditableField label="Wrist" value={form.suit.wrist} isEditing={isEditing} unit="inches" type="number" onChange={v => setForm(f => ({ ...f, suit: { ...f.suit, wrist: Number(v) } }))} />
              <EditableField label="Armhole" value={form.suit.armhole} isEditing={isEditing} unit="inches" type="number" onChange={v => setForm(f => ({ ...f, suit: { ...f.suit, armhole: Number(v) } }))} />
              <EditableField label="Front Length" value={form.suit.frontLength} isEditing={isEditing} unit="inches" type="number" onChange={v => setForm(f => ({ ...f, suit: { ...f.suit, frontLength: Number(v) } }))} />
            </div>
            <h4 className="text-sm font-semibold text-primary mb-3">Jacket Details</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <EditableField label="Jacket Length" value={form.suit.jacketLength} isEditing={isEditing} unit="inches" type="number" onChange={v => setForm(f => ({ ...f, suit: { ...f.suit, jacketLength: Number(v) } }))} />
              <EditableField label="Lapel Width" value={form.suit.lapelWidth} isEditing={isEditing} unit="inches" type="number" onChange={v => setForm(f => ({ ...f, suit: { ...f.suit, lapelWidth: Number(v) } }))} />
              <EditableField label="Button Style" value={form.suit.buttonStyle} isEditing={isEditing} onChange={v => setForm(f => ({ ...f, suit: { ...f.suit, buttonStyle: v } }))} />
              <EditableField label="Vent Style" value={form.suit.ventStyle} isEditing={isEditing} onChange={v => setForm(f => ({ ...f, suit: { ...f.suit, ventStyle: v } }))} />
              <EditableField label="Pocket Style" value={form.suit.pocketStyle} isEditing={isEditing} onChange={v => setForm(f => ({ ...f, suit: { ...f.suit, pocketStyle: v } }))} />
            </div>
            <h4 className="text-sm font-semibold text-primary mb-3">Fit Preference</h4>
            <EditableField label="Overall Fit" value={form.suit.overallFit} isEditing={isEditing} onChange={v => setForm(f => ({ ...f, suit: { ...f.suit, overallFit: v } }))} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="shirt">
          <SectionCard title="Shirt Measurements" onEdit={!isEditing ? () => setIsEditing(true) : undefined}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <EditableField label="Chest" value={form.shirt.chest} isEditing={isEditing} unit="inches" type="number" onChange={v => setForm(f => ({ ...f, shirt: { ...f.shirt, chest: Number(v) } }))} />
              <EditableField label="Waist" value={form.shirt.waist} isEditing={isEditing} unit="inches" type="number" onChange={v => setForm(f => ({ ...f, shirt: { ...f.shirt, waist: Number(v) } }))} />
              <EditableField label="Shoulder Width" value={form.shirt.shoulderWidth} isEditing={isEditing} unit="inches" type="number" onChange={v => setForm(f => ({ ...f, shirt: { ...f.shirt, shoulderWidth: Number(v) } }))} />
              <EditableField label="Sleeve Length" value={form.shirt.sleeveLength} isEditing={isEditing} unit="inches" type="number" onChange={v => setForm(f => ({ ...f, shirt: { ...f.shirt, sleeveLength: Number(v) } }))} />
              <EditableField label="Neck" value={form.shirt.neck} isEditing={isEditing} unit="inches" type="number" onChange={v => setForm(f => ({ ...f, shirt: { ...f.shirt, neck: Number(v) } }))} />
              <EditableField label="Bicep" value={form.shirt.bicep} isEditing={isEditing} unit="inches" type="number" onChange={v => setForm(f => ({ ...f, shirt: { ...f.shirt, bicep: Number(v) } }))} />
              <EditableField label="Wrist" value={form.shirt.wrist} isEditing={isEditing} unit="inches" type="number" onChange={v => setForm(f => ({ ...f, shirt: { ...f.shirt, wrist: Number(v) } }))} />
              <EditableField label="Shirt Length" value={form.shirt.shirtLength} isEditing={isEditing} unit="inches" type="number" onChange={v => setForm(f => ({ ...f, shirt: { ...f.shirt, shirtLength: Number(v) } }))} />
              <EditableField label="Cuff Style" value={form.shirt.cuffStyle} isEditing={isEditing} onChange={v => setForm(f => ({ ...f, shirt: { ...f.shirt, cuffStyle: v } }))} />
              <EditableField label="Collar Style" value={form.shirt.collarStyle} isEditing={isEditing} onChange={v => setForm(f => ({ ...f, shirt: { ...f.shirt, collarStyle: v } }))} />
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="pants">
          <SectionCard title="Pants Measurements" onEdit={!isEditing ? () => setIsEditing(true) : undefined}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <EditableField label="Waist" value={form.pants.waist} isEditing={isEditing} unit="inches" type="number" onChange={v => setForm(f => ({ ...f, pants: { ...f.pants, waist: Number(v) } }))} />
              <EditableField label="Hip" value={form.pants.hip} isEditing={isEditing} unit="inches" type="number" onChange={v => setForm(f => ({ ...f, pants: { ...f.pants, hip: Number(v) } }))} />
              <EditableField label="Inseam" value={form.pants.inseam} isEditing={isEditing} unit="inches" type="number" onChange={v => setForm(f => ({ ...f, pants: { ...f.pants, inseam: Number(v) } }))} />
              <EditableField label="Outseam" value={form.pants.outseam} isEditing={isEditing} unit="inches" type="number" onChange={v => setForm(f => ({ ...f, pants: { ...f.pants, outseam: Number(v) } }))} />
              <EditableField label="Thigh" value={form.pants.thigh} isEditing={isEditing} unit="inches" type="number" onChange={v => setForm(f => ({ ...f, pants: { ...f.pants, thigh: Number(v) } }))} />
              <EditableField label="Knee" value={form.pants.knee} isEditing={isEditing} unit="inches" type="number" onChange={v => setForm(f => ({ ...f, pants: { ...f.pants, knee: Number(v) } }))} />
              <EditableField label="Leg Opening" value={form.pants.legOpening} isEditing={isEditing} unit="inches" type="number" onChange={v => setForm(f => ({ ...f, pants: { ...f.pants, legOpening: Number(v) } }))} />
              <EditableField label="Rise" value={form.pants.rise} isEditing={isEditing} unit="inches" type="number" onChange={v => setForm(f => ({ ...f, pants: { ...f.pants, rise: Number(v) } }))} />
              <EditableField label="Fit Type" value={form.pants.fitType} isEditing={isEditing} onChange={v => setForm(f => ({ ...f, pants: { ...f.pants, fitType: v } }))} />
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>

      {/* Notes */}
      <SectionCard title="" className="mb-6" onEdit={!isEditing ? () => setIsEditing(true) : undefined}>
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm sm:text-base font-semibold">Measurement Notes & Special Instructions</h3>
        </div>
        <EditableField label="" value={form.notes || 'No notes'} isEditing={isEditing} type="textarea" onChange={v => setForm(f => ({ ...f, notes: v }))} />
      </SectionCard>

      {/* History */}
      <SectionCard title="Measurement History">
        <div className="space-y-4">
          {m.history.map((h, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${i === 0 ? 'bg-destructive' : 'bg-accent'}`} />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold">{h.title}</p>
                  <span className="text-xs text-muted-foreground">{h.date}</span>
                </div>
                <p className="text-xs text-muted-foreground">Taken by: {h.takenBy}</p>
                <p className="text-xs text-muted-foreground italic">{h.description}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

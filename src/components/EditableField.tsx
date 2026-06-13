import type { ComponentProps, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { PhoneInput } from "@/components/PhoneInput";
import { DatePickerField } from "@/components/DatePickerField";
import { formatPhoneDisplay } from "@/lib/phone";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Timer,
  ClipboardList,
  FileText,
  Heart,
  Shield,
  Hash,
} from "lucide-react";

interface EditableFieldProps {
  label: string;
  value: string | number;
  isEditing: boolean;
  onChange?: (value: string) => void;
  type?: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'phone';
  options?: { value: string; label: string }[];
  unit?: string;
}

function getIconForLabel(label: string): ReactNode {
  const l = label.toLowerCase().trim();
  const className = "h-3.5 w-3.5 text-muted-foreground shrink-0";
  if (l.includes("name") || l.includes("person") || l.includes("customer")) return <User className={className} />;
  if (l.includes("phone") || l.includes("mobile") || l.includes("contact")) return <Phone className={className} />;
  if (l.includes("email") || l.includes("mail")) return <Mail className={className} />;
  if (l.includes("address") || l.includes("location") || l.includes("city")) return <MapPin className={className} />;
  if (l.includes("duration")) return <Timer className={className} />;
  if (l.includes("service")) return <ClipboardList className={className} />;
  if (l === "time" || /\btime\b/.test(l)) return <Clock className={className} />;
  if (l.includes("date") || l.includes("birthday") || l.includes("visit")) return <Calendar className={className} />;
  if (l.includes("note") || l.includes("remark") || l.includes("comment")) return <FileText className={className} />;
  if (l.includes("preference") || l.includes("favorite") || l.includes("fit")) return <Heart className={className} />;
  if (l.includes("status")) return <Shield className={className} />;
  if (l.includes("id") || l.includes("code") || l.includes("number")) return <Hash className={className} />;
  return null;
}

export default function EditableField({ label, value, isEditing, onChange, type = 'text', options, unit }: EditableFieldProps) {
  const renderLabel = (mb: string = "mb-1") => {
    const icon = getIconForLabel(label);
    return (
      <div className={`flex items-center gap-1.5 ${mb}`}>
        {icon ? <span className="inline-flex shrink-0">{icon}</span> : null}
        <p className="text-xs text-muted-foreground leading-none">{label}</p>
      </div>
    );
  };

  if (!isEditing) {
    let displayValue = value;
    if (type === "phone") {
      displayValue = formatPhoneDisplay(String(value));
    } else if (type === 'date' && typeof value === 'string' && value) {
      try {
        displayValue = format(new Date(value), 'dd-MMM-yyyy');
      } catch (e) {
        // ignore
      }
    }
    
    return (
      <div>
        {renderLabel("mb-1")}
        <p className="text-sm font-medium text-foreground">
          {displayValue}{unit ? ` ${unit}` : ''}
        </p>
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div>
        {renderLabel()}
        <Textarea value={String(value)} onChange={e => onChange?.(e.target.value)} className="text-sm" rows={3} />
      </div>
    );
  }

  if (type === 'select' && options) {
    return (
      <div>
        {renderLabel()}
        <Select value={String(value)} onValueChange={v => onChange?.(v)}>
          <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (type === "phone") {
    return (
      <div>
        {renderLabel()}
        <PhoneInput value={String(value)} onChange={(v) => onChange?.(v)} className="text-sm" />
      </div>
    );
  }

  if (type === "date") {
    return (
      <div>
        {renderLabel()}
        <DatePickerField value={String(value)} onChange={(v) => onChange?.(v)} className="text-sm" />
      </div>
    );
  }

  return (
    <div>
      {renderLabel()}
      <div className="flex items-center gap-2">
        <Input
          type={type === 'number' ? 'number' : 'text'}
          value={String(value)}
          onChange={e => onChange?.(e.target.value)}
          className="text-sm"
        />
        {unit && <span className="text-xs text-primary font-medium bg-gradient-to-r from-primary/10 to-accent/10 px-2 py-1 rounded-md">{unit}</span>}
      </div>
    </div>
  );
}

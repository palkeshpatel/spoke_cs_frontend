import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

interface EditableFieldProps {
  label: string;
  value: string | number;
  isEditing: boolean;
  onChange?: (value: string) => void;
  type?: 'text' | 'textarea' | 'select' | 'number' | 'date';
  options?: { value: string; label: string }[];
  unit?: string;
}

export default function EditableField({ label, value, isEditing, onChange, type = 'text', options, unit }: EditableFieldProps) {
  if (!isEditing) {
    let displayValue = value;
    if (type === 'date' && typeof value === 'string' && value) {
      try {
        displayValue = format(new Date(value), 'dd-MMM-yyyy');
      } catch (e) {
        // ignore
      }
    }
    
    return (
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-medium text-foreground">
          {displayValue}{unit ? ` ${unit}` : ''}
        </p>
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div>
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <Textarea value={String(value)} onChange={e => onChange?.(e.target.value)} className="text-sm" rows={3} />
      </div>
    );
  }

  if (type === 'select' && options) {
    return (
      <div>
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <Select value={String(value)} onValueChange={v => onChange?.(v)}>
          <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <Input
          type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
          value={String(value)}
          onChange={e => onChange?.(e.target.value)}
          className="text-sm"
        />
        {unit && <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded">{unit}</span>}
      </div>
    </div>
  );
}

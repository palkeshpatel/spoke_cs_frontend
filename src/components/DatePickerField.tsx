import { Input } from "@/components/ui/input";

type DatePickerFieldProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
};

export function DatePickerField({
  value,
  onChange,
  disabled,
  placeholder,
  className,
  id,
}: DatePickerFieldProps) {
  return (
    <Input
      id={id}
      type="date"
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}


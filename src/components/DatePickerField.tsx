import DatePicker from "@/components/DatePicker";

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
  disabled, // Note: the custom DatePicker doesn't support disabled out-of-the-box yet, but we'll accept it
  placeholder,
  className,
  id,
}: DatePickerFieldProps) {
  return (
    <div id={id}>
      <DatePicker
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
      />
    </div>
  );
}


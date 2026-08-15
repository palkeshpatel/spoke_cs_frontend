import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatPhoneMask } from "@/lib/phone";

type PhoneInputProps = Omit<ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  value: string;
  onChange: (value: string) => void;
};

export function PhoneInput({ value, onChange, className, placeholder = "9999999999", ...props }: PhoneInputProps) {
  return (
    <Input
      {...props}
      type="tel"
      inputMode="numeric"
      autoComplete="tel-national"
      placeholder={placeholder}
      maxLength={10}
      value={value}
      className={cn(className)}
      onChange={(e) => onChange(formatPhoneMask(e.target.value))}
    />
  );
}

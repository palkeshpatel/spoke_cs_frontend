import { useState, useRef, useEffect } from "react";
import { CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parse, isValid } from "date-fns";

interface DatePickerProps {
  value: string;         // "YYYY-MM-DD" or ""
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  min?: string;          // "YYYY-MM-DD"
  disabled?: boolean;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  className,
  min,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = value
    ? parse(value, "yyyy-MM-dd", new Date())
    : undefined;

  const displayValue =
    selectedDate && isValid(selectedDate)
      ? format(selectedDate, "dd MMM yyyy")
      : "";

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const minDate = min ? parse(min, "yyyy-MM-dd", new Date()) : undefined;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-left ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          !displayValue && "text-muted-foreground",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1">{displayValue || placeholder}</span>
      </button>

      {/* Calendar dropdown from react-day-picker (via shadcn Calendar) */}
      {open && (
        <div className="absolute z-50 mt-1 left-0 shadow-xl">
          <Calendar
            mode="single"
            selected={selectedDate && isValid(selectedDate) ? selectedDate : undefined}
            onSelect={(date) => {
              if (date) {
                onChange(format(date, "yyyy-MM-dd"));
              }
              setOpen(false);
            }}
            disabled={minDate ? { before: minDate } : undefined}
            defaultMonth={selectedDate && isValid(selectedDate) ? selectedDate : new Date()}
            className="!p-2 text-xs [&_.rdp-day]:h-7 [&_.rdp-day]:w-7 [&_.rdp-day_button]:h-7 [&_.rdp-day_button]:w-7 [&_.rdp-day_button]:text-xs [&_.rdp-weekday]:w-7 [&_.rdp-weekday]:text-xs [&_.rdp-caption_label]:text-xs [&_.rdp-nav_button]:h-6 [&_.rdp-nav_button]:w-6 bg-card"
          />
        </div>
      )}
    </div>
  );
}

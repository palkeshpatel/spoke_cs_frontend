import { useState, useRef, useEffect } from "react";
import { CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { format, parse, isValid } from "date-fns";

interface DatePickerProps {
  value: string;         // "YYYY-MM-DD" or ""
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  min?: string;          // "YYYY-MM-DD"
  disabled?: boolean;
  usePopover?: boolean;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  className,
  min,
  disabled = false,
  usePopover = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const selectedDate = value
    ? parse(value, "yyyy-MM-dd", new Date())
    : undefined;

  const displayValue =
    selectedDate && isValid(selectedDate)
      ? format(selectedDate, "dd MMM yyyy")
      : "";

  // Close on outside click
  useEffect(() => {
    if (usePopover || !open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, usePopover]);

  const minDate = min ? parse(min, "yyyy-MM-dd", new Date()) : undefined;

  const buttonContent = (
    <>
      <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="flex-1">{displayValue || placeholder}</span>
    </>
  );

  const buttonClassName = cn(
    "flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-left ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    !displayValue && "text-muted-foreground",
    disabled && "opacity-50 cursor-not-allowed"
  );

  const calendarProps = {
    mode: "single" as const,
    selected: selectedDate && isValid(selectedDate) ? selectedDate : undefined,
    onSelect: (date: Date | undefined) => {
      if (date) {
        onChange(format(date, "yyyy-MM-dd"));
      }
      setOpen(false);
    },
    disabled: minDate ? { before: minDate } : undefined,
    defaultMonth: selectedDate && isValid(selectedDate) ? selectedDate : new Date(),
    className: isMobile 
      ? "!p-4 text-base [&_.rdp-day]:h-11 [&_.rdp-day]:w-11 [&_.rdp-day_button]:h-11 [&_.rdp-day_button]:w-11 [&_.rdp-day_button]:text-base [&_.rdp-weekday]:w-11 [&_.rdp-weekday]:text-sm [&_.rdp-caption_label]:text-lg [&_.rdp-nav_button]:h-8 [&_.rdp-nav_button]:w-8 bg-card flex justify-center"
      : "!p-2 text-xs [&_.rdp-day]:h-7 [&_.rdp-day]:w-7 [&_.rdp-day_button]:h-7 [&_.rdp-day_button]:w-7 [&_.rdp-day_button]:text-xs [&_.rdp-weekday]:w-7 [&_.rdp-weekday]:text-xs [&_.rdp-caption_label]:text-xs [&_.rdp-nav_button]:h-6 [&_.rdp-nav_button]:w-6 bg-card"
  };

  if (usePopover || isMobile) {
    if (isMobile) {
      return (
        <div className={cn("w-full", className)}>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button type="button" disabled={disabled} className={buttonClassName}>
                {buttonContent}
              </button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-sm p-0 border-none bg-transparent shadow-none [&>button]:hidden flex justify-center mx-auto">
              <DialogTitle className="sr-only">Select Date</DialogTitle>
              <div className="bg-card rounded-2xl shadow-2xl p-2 sm:p-4 border overflow-hidden flex justify-center w-full">
                <Calendar {...calendarProps} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      );
    }

    return (
      <div className={cn("w-full", className)}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button type="button" disabled={disabled} className={buttonClassName}>
              {buttonContent}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-[60]" align="start">
            <Calendar {...calendarProps} />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={buttonClassName}
      >
        {buttonContent}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 left-0 shadow-xl">
          <Calendar {...calendarProps} />
        </div>
      )}
    </div>
  );
}

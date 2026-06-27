import * as React from "react";
import { Clock } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

/**
 * Single-point time picker using a draggable slider.
 * value / onChange use "HH:MM" (24-hour) strings to stay compatible with the form.
 */
interface TimePickerProps {
  value: string;        // "HH:MM" or ""
  onChange: (v: string) => void;
  className?: string;
  min?: number;         // hour (0-23), default 0
  max?: number;         // hour (0-23), default 23
}

/** Convert decimal hours → "HH:MM" */
function toHHMM(decimal: number): string {
  const totalMinutes = Math.round(decimal * 60);
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Parse "HH:MM" → decimal hours */
function parseHHMM(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) + (m || 0) / 60;
}

/** Decimal hours → "10:30 AM" display */
function formatDisplay(decimal: number): string {
  const totalMinutes = Math.round(decimal * 60);
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  let displayH = h % 12;
  if (displayH === 0) displayH = 12;
  return `${displayH}:${String(m).padStart(2, "0")} ${ampm}`;
}

// Tick labels shown below the track
const TICKS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
function tickLabel(h: number) {
  if (h === 0 || h === 24) return "12a";
  if (h === 12) return "12p";
  return h > 12 ? `${h - 12}p` : `${h}a`;
}

export default function TimePicker({
  value,
  onChange,
  className,
  min = 0,
  max = 24,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Default to 9 AM if no value
  const decimal = value ? parseHHMM(value) : 9;

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const displayValue = value ? formatDisplay(decimal) : "";

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-left ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          !displayValue && "text-muted-foreground"
        )}
      >
        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1">{displayValue || "Select time"}</span>
      </button>

      {/* Popup */}
      {open && (
        <div className="absolute z-50 mt-1 right-0 w-80 rounded-xl border border-border bg-card shadow-xl p-4">
          {/* Selected time display */}
          <div className="text-center mb-4">
            <span className="text-2xl font-bold text-primary">
              {formatDisplay(decimal)}
            </span>
          </div>

          {/* Slider with tick marks */}
          <div className="relative pt-1 pb-8">
            <Slider
              min={min}
              max={max}
              step={1 / 12}   // 5-minute intervals
              value={[decimal]}
              onValueChange={([v]) => onChange(toHHMM(v))}
            />
            {/* Tick marks */}
            <div className="absolute top-6 left-0 right-0 flex justify-between pointer-events-none px-[10px]">
              {TICKS.filter(h => h >= min && h <= max).map(h => (
                <div key={h} className="flex flex-col items-center" style={{ width: 0 }}>
                  <div className="h-1.5 w-px bg-muted-foreground/30 mb-0.5" />
                  <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                    {tickLabel(h)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Done button */}
          <button
            type="button"
            onClick={() => {
              if (!value) onChange(toHHMM(decimal));
              setOpen(false);
            }}
            className="mt-2 w-full h-9 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import "react-day-picker/style.css";

import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * react-day-picker v9 + default `style.css` (rdp-* classes).
 * Older shadcn snippets used v8 class names and broke the grid layout.
 */
function Calendar({ className, showOutsideDays = true, components: userComponents, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "rounded-lg border border-border bg-card p-3 text-foreground shadow-sm [--rdp-accent-color:hsl(var(--primary))] [--rdp-accent-background-color:hsl(var(--primary)/0.12)] [--rdp-today-color:hsl(var(--primary))]",
        className,
      )}
      components={{
        Chevron: ({ className: chevronClassName, orientation, ...chevronProps }) => {
          if (orientation === "left") {
            return <ChevronLeft className={cn("h-4 w-4", chevronClassName)} {...chevronProps} />;
          }
          return <ChevronRight className={cn("h-4 w-4", chevronClassName)} {...chevronProps} />;
        },
        ...userComponents,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };

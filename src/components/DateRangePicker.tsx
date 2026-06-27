import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { format, isValid, parse } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DateRangePickerProps {
  dateFrom?: string;
  dateTo?: string;
  onChange: (range: { from?: string; to?: string }) => void;
  className?: string;
}

export function DateRangePicker({
  dateFrom,
  dateTo,
  onChange,
  className,
}: DateRangePickerProps) {
  const parsedFrom = dateFrom ? parse(dateFrom, "yyyy-MM-dd", new Date()) : undefined;
  const parsedTo = dateTo ? parse(dateTo, "yyyy-MM-dd", new Date()) : undefined;

  const date = {
    from: parsedFrom && isValid(parsedFrom) ? parsedFrom : undefined,
    to: parsedTo && isValid(parsedTo) ? parsedTo : undefined,
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal h-10",
              !date.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={(newDate) => {
              onChange({
                from: newDate?.from ? format(newDate.from, "yyyy-MM-dd") : undefined,
                to: newDate?.to ? format(newDate.to, "yyyy-MM-dd") : undefined,
              });
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

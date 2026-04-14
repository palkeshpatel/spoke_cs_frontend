import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CustomerSelectProps {
  customers: { id: number; name: string; customer_code?: string; phone?: string; email?: string }[];
  value?: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function CustomerSelect({ customers, value, onChange, isLoading, disabled }: CustomerSelectProps) {
  const [open, setOpen] = React.useState(false);

  const sortedCustomers = React.useMemo(() => {
    return [...customers].sort((a, b) => a.name.localeCompare(b.name));
  }, [customers]);

  const selectedCustomer = sortedCustomers.find((c) => String(c.id) === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled || isLoading}
        >
          <span className="truncate">
            {isLoading
              ? "Loading customers..."
              : selectedCustomer
              ? `${selectedCustomer.name} ${selectedCustomer.customer_code ? `(${selectedCustomer.customer_code})` : ""}`
              : "Select customer..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      {/* Set same width as trigger for popover via CSS variable hack or just allow dynamic growth. Setting w-[var(--radix-popover-trigger-width)] works great internally for popovers to match input width! */}
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by name, code, or phone..." />
          <CommandList>
            <CommandEmpty>No customers found.</CommandEmpty>
            <CommandGroup>
              {sortedCustomers.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`${c.name} ${c.customer_code || ""} ${c.phone || ""} ${c.id}`}
                  onSelect={() => {
                    onChange(String(c.id));
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 flex-shrink-0",
                      value === String(c.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate font-medium">{c.name} {c.customer_code ? `(${c.customer_code})` : ""}</span>
                    {(c.phone || c.email) && (
                      <span className="text-xs text-muted-foreground truncate">{c.phone || c.email}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * CustomerSelectWithAdd
 *
 * Drop-in replacement for CustomerSelect that adds a "+" button to create a
 * new customer inline. Handles its own data-fetching and customer-creation
 * mutation so parent pages only need to supply `value` / `onChange`.
 */
import * as React from "react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X, UserPlus, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { createCustomer, listCustomers } from "@/services/customers";
import { isValidEmail } from "@/lib/utils";
import { cn } from "@/lib/utils";
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

interface CustomerSelectWithAddProps {
  /** Currently selected customer id (string or undefined) */
  value?: string;
  /** Called with the new customer id string whenever a customer is selected or created */
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export default function CustomerSelectWithAdd({
  value,
  onChange,
  disabled,
  placeholder = "Select customer...",
  className,
}: CustomerSelectWithAddProps) {
  const queryClient = useQueryClient();

  // ── mode ────────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<"select" | "create">("select");

  // ── combobox open state ──────────────────────────────────────────────────────
  const [open, setOpen] = useState(false);

  // ── new customer fields ──────────────────────────────────────────────────────
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // ── customers query (self-contained) ────────────────────────────────────────
  const customersQuery = useQuery({
    queryKey: ["customers", "list"],
    queryFn: () => listCustomers(200),
    staleTime: 30_000,
  });

  const customers = customersQuery.data?.data ?? [];

  const sortedCustomers = useMemo(
    () => [...customers].sort((a, b) => a.name.localeCompare(b.name)),
    [customers],
  );

  const selectedCustomer = sortedCustomers.find((c) => String(c.id) === value);

  // ── duplicate email check ────────────────────────────────────────────────────
  const existingByEmail = useMemo(() => {
    const em = newEmail.trim().toLowerCase();
    if (!em) return null;
    return customers.find((c) => (c.email ?? "").trim().toLowerCase() === em) ?? null;
  }, [customers, newEmail]);

  // ── reset helper ─────────────────────────────────────────────────────────────
  const resetForm = () => {
    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setMode("select");
  };

  // ── create mutation ───────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () =>
      createCustomer({
        name: newName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim() || null,
      }),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      onChange(String(created.id));
      resetForm();
      toast({
        title: "Customer added",
        description: `${created.name} was created and selected.`,
      });
    },
    onError: (err: unknown) => {
      const msg =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message?: unknown }).message ?? "")
          : "";
      toast({
        title: "Failed to create customer",
        description: msg || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!newName.trim()) {
      toast({ title: "Name required", description: "Enter the customer's name.", variant: "destructive" });
      return;
    }
    if (!isValidEmail(newEmail)) {
      toast({ title: "Valid email required", description: "Enter a valid email address.", variant: "destructive" });
      return;
    }
    if (existingByEmail) {
      toast({ title: "Email already exists", description: "Select the existing customer instead.", variant: "destructive" });
      return;
    }
    createMutation.mutate();
  };

  // ── CREATE MODE ──────────────────────────────────────────────────────────────
  if (mode === "create") {
    return (
      <div className={cn("rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3", className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Quick Add Customer</span>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-2.5">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Full Name <span className="text-destructive">*</span>
            </label>
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. John Smith"
              className="h-9 text-sm bg-background"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>

          {/* Email + Phone side by side */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Email <span className="text-destructive">*</span>
              </label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@example.com"
                className="h-9 text-sm bg-background"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
              <Input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+91 ..."
                className="h-9 text-sm bg-background"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
          </div>

          {/* Duplicate email warning */}
          {existingByEmail && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-xs text-amber-800">
                <span className="font-semibold">Email already linked to:</span>{" "}
                {existingByEmail.name} ({existingByEmail.customer_code})
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs px-2 shrink-0"
                onClick={() => {
                  onChange(String(existingByEmail.id));
                  resetForm();
                  toast({ title: "Customer selected", description: `${existingByEmail.name} selected.` });
                }}
              >
                Use existing
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={resetForm}
            className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
          >
            Choose existing instead
          </button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={createMutation.isPending}
            className="gap-1.5 h-8 text-xs px-4"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UserPlus className="w-3.5 h-3.5" />
            )}
            {createMutation.isPending ? "Saving..." : "Add Customer"}
          </Button>
        </div>
      </div>
    );
  }

  // ── SELECT MODE ──────────────────────────────────────────────────────────────
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Combobox */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex-1 justify-between font-normal"
            disabled={disabled || customersQuery.isLoading}
          >
            <span className="truncate">
              {customersQuery.isLoading
                ? "Loading customers..."
                : selectedCustomer
                  ? `${selectedCustomer.name}${selectedCustomer.customer_code ? ` (${selectedCustomer.customer_code})` : ""}`
                  : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search by name, code, or phone..." />
            <CommandList>
              <CommandEmpty>
                <div className="py-4 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">No customers found.</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs h-7"
                    onClick={() => {
                      setOpen(false);
                      setMode("create");
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add new customer
                  </Button>
                </div>
              </CommandEmpty>
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
                        value === String(c.id) ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate font-medium">
                        {c.name}
                        {c.customer_code ? ` (${c.customer_code})` : ""}
                      </span>
                      {(c.phone || c.email) && (
                        <span className="text-xs text-muted-foreground truncate">
                          {c.phone || c.email}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* + Button */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={disabled}
        onClick={() => setMode("create")}
        title="Add new customer"
        className="shrink-0 border-dashed hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const ORDER_STATUS_STEPS = [
  { id: "measurement", label: "Measurement" },
  { id: "cutting", label: "Cutting" },
  { id: "stitching", label: "Stitching" },
  { id: "trial_1", label: "Trial 1" },
  { id: "trial_2", label: "Trial 2" },
  { id: "delivery", label: "Delivery" },
];

export const ORDER_STATUS_INDEX = ORDER_STATUS_STEPS.reduce(
  (acc, step, index) => {
    acc[step.id] = index;
    return acc;
  },
  {} as Record<string, number>
);

interface OrderStatusStepperProps {
  status: string;
  onChange?: (status: string) => void;
  isEditing?: boolean;
  size?: "sm" | "md";
}

export function OrderStatusStepper({
  status,
  onChange,
  isEditing = false,
  size = "md",
}: OrderStatusStepperProps) {
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  // If status is completed or delivered, we treat all steps as done
  const isFullyDone = status === "completed" || status === "delivered";
  const currentIndex = isFullyDone ? ORDER_STATUS_STEPS.length : (ORDER_STATUS_INDEX[status] ?? 0);

  const handleStepClick = (stepId: string) => {
    if (!isEditing || !onChange) return;
    if (stepId === status) return;
    setPendingStatus(stepId);
  };

  const confirmChange = () => {
    if (pendingStatus && onChange) {
      onChange(pendingStatus);
    }
    setPendingStatus(null);
  };

  const isSm = size === "sm";

  return (
    <>
      <div className={cn("w-full relative", isSm ? "py-2" : "py-4")}>
        {/* Background track line */}
        <div className={cn("absolute left-[10%] right-[10%] h-1 bg-muted rounded-full z-0", isSm ? "top-[18px]" : "top-[27px]")} />
        
        {/* Progress track line */}
        <div
          className={cn("absolute left-[10%] h-1 bg-primary rounded-full z-0 transition-all duration-500 ease-in-out", isSm ? "top-[18px]" : "top-[27px]")}
          style={{ width: `${currentIndex === 0 ? 0 : (currentIndex / (ORDER_STATUS_STEPS.length - 1)) * 80}%` }}
        />

        <div className="flex items-start justify-between relative z-10">
          {ORDER_STATUS_STEPS.map((step, idx) => {
            const isCompleted = isFullyDone || idx < currentIndex;
            const isActive = !isFullyDone && idx === currentIndex;
            const isUpcoming = !isFullyDone && idx > currentIndex;

            return (
              <div key={step.id} className="flex flex-col items-center gap-2 w-full relative group">
                <button
                  type="button"
                  disabled={!isEditing}
                  onClick={() => handleStepClick(step.id)}
                  className={cn(
                    "rounded-full flex items-center justify-center transition-all duration-300 border-[3px] bg-background z-10",
                    isSm ? "w-6 h-6" : "w-8 h-8",
                    isCompleted && "bg-green-500 border-green-500 text-white",
                    isActive && "border-blue-600 bg-blue-600 text-white ring-4 ring-blue-600/20 scale-110",
                    isUpcoming && "border-muted-foreground/30 text-muted-foreground",
                    isEditing && "cursor-pointer group-hover:scale-110 group-hover:border-primary/50",
                    !isEditing && "cursor-default"
                  )}
                >
                  {isCompleted ? <Check className={cn("stroke-[3]", isSm ? "w-3.5 h-3.5" : "w-4 h-4")} /> : (isActive ? <div className={cn("rounded-full bg-white animate-pulse", isSm ? "w-2 h-2" : "w-2.5 h-2.5")} /> : null)}
                </button>
                <span
                  className={cn(
                    "font-semibold whitespace-nowrap transition-colors",
                    isSm ? "text-[10px]" : "text-[11px] sm:text-xs",
                    isCompleted ? "text-green-600" : isActive ? "text-blue-600" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <AlertDialog open={!!pendingStatus} onOpenChange={(open) => !open && setPendingStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Order Status?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the order status to <span className="font-semibold text-foreground">{ORDER_STATUS_STEPS.find(s => s.id === pendingStatus)?.label}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmChange}>Confirm Change</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

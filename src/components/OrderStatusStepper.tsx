import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

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
}

export function OrderStatusStepper({
  status,
  onChange,
  isEditing = false,
}: OrderStatusStepperProps) {
  // If status is completed or delivered, we treat all steps as done
  const isFullyDone = status === "completed" || status === "delivered";
  const currentIndex = isFullyDone ? ORDER_STATUS_STEPS.length : (ORDER_STATUS_INDEX[status] ?? 0);

  return (
    <div className="w-full flex items-center justify-between relative py-2">
      {/* Background track line */}
      <div className="absolute left-[5%] right-[5%] top-[19px] h-[2px] bg-border -z-10" />
      
      {/* Progress track line */}
      <div
        className="absolute left-[5%] top-[19px] h-[2px] bg-primary -z-10 transition-all duration-300"
        style={{ width: \`\${currentIndex === 0 ? 0 : (currentIndex / (ORDER_STATUS_STEPS.length - 1)) * 90}%\` }}
      />

      {ORDER_STATUS_STEPS.map((step, idx) => {
        const isCompleted = isFullyDone || idx < currentIndex;
        const isActive = !isFullyDone && idx === currentIndex;
        const isUpcoming = !isFullyDone && idx > currentIndex;

        return (
          <div key={step.id} className="flex flex-col items-center gap-2 z-10 relative">
            <button
              type="button"
              disabled={!isEditing}
              onClick={() => onChange?.(step.id)}
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-colors border-2 bg-background",
                isCompleted && "bg-green-600 border-green-600 text-white",
                isActive && "border-blue-600 bg-blue-600 text-white shadow-[0_0_0_3px_rgba(37,99,235,0.2)]",
                isUpcoming && "border-muted-foreground",
                isEditing && "cursor-pointer hover:scale-110",
                !isEditing && "cursor-default"
              )}
            >
              {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : (isActive ? <div className="w-2 h-2 rounded-full bg-white" /> : null)}
            </button>
            <span
              className={cn(
                "text-[10px] font-medium whitespace-nowrap",
                (isCompleted || isActive) ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

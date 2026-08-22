import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors select-none tracking-wide",
  {
    variants: {
      variant: {
        default:
          "bg-[#1C1E26] text-white border-transparent",
        mint:
          "bg-[#D1EBE1] text-[#1D5E4D] border border-[rgba(29,94,77,0.18)]",
        lavender:
          "bg-[#E3DBF8] text-[#4B3B7A] border border-[rgba(75,59,122,0.18)]",
        butter:
          "bg-[#FEE7B3] text-[#785308] border border-[rgba(120,83,8,0.18)]",
        sky:
          "bg-[#D2E5FA] text-[#21518A] border border-[rgba(33,81,138,0.18)]",
        coral:
          "bg-[#FCD9D7] text-[#852C28] border border-[rgba(133,44,40,0.18)]",
        white:
          "bg-white text-[#1C1E26] border border-[rgba(28,30,38,0.08)] shadow-[0_2px_6px_rgba(28,30,38,0.04)]",
        outline:
          "border border-[rgba(28,30,38,0.15)] text-[#1C1E26] bg-transparent",
        slate:
          "bg-[#F0EEF6] text-[#5A5E70] border border-[rgba(28,30,38,0.06)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

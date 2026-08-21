import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#1C1E26] text-white hover:bg-[#2A2D39] active:translate-y-[1px] shadow-[0_4px_12px_rgba(28,30,38,0.08)]",
        primary:
          "bg-[#1C1E26] text-white hover:bg-[#2C303E] active:translate-y-[1px] shadow-[0_4px_12px_rgba(28,30,38,0.1)]",
        mint:
          "bg-[#D1EBE1] text-[#1D5E4D] border border-[rgba(29,94,77,0.15)] hover:bg-[#C2E4D8] active:translate-y-[1px] shadow-[0_4px_12px_rgba(29,94,77,0.06)]",
        lavender:
          "bg-[#E3DBF8] text-[#4B3B7A] border border-[rgba(75,59,122,0.15)] hover:bg-[#D7CBF5] active:translate-y-[1px] shadow-[0_4px_12px_rgba(75,59,122,0.06)]",
        butter:
          "bg-[#FEE7B3] text-[#785308] border border-[rgba(120,83,8,0.15)] hover:bg-[#FDE09E] active:translate-y-[1px] shadow-[0_4px_12px_rgba(120,83,8,0.06)]",
        sky:
          "bg-[#D2E5FA] text-[#21518A] border border-[rgba(33,81,138,0.15)] hover:bg-[#C2DCF8] active:translate-y-[1px] shadow-[0_4px_12px_rgba(33,81,138,0.06)]",
        coral:
          "bg-[#FCD9D7] text-[#852C28] border border-[rgba(133,44,40,0.15)] hover:bg-[#FACBC9] active:translate-y-[1px] shadow-[0_4px_12px_rgba(133,44,40,0.06)]",
        outline:
          "border border-[rgba(28,30,38,0.12)] bg-white text-[#1C1E26] hover:bg-[#F7F6FA] active:translate-y-[1px] shadow-[0_2px_8px_rgba(28,30,38,0.03)]",
        ghost:
          "text-[#5A5E70] hover:bg-[#F0EEF6] hover:text-[#1C1E26]",
        link:
          "text-[#1C1E26] underline-offset-4 hover:underline",
        circleAction:
          "w-11 h-11 rounded-full bg-white text-[#1C1E26] border border-[rgba(28,30,38,0.08)] shadow-[0_4px_12px_rgba(28,30,38,0.04)] hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(28,30,38,0.08)] active:translate-y-0",
        
        /* Claymorphic 3D Buttons */
        clayPrimary:
          "clay-btn clay-btn-dark",
        clayWhite:
          "clay-btn clay-btn-white",
        clayMint:
          "clay-btn clay-mint hover:brightness-95",
        clayLavender:
          "clay-btn clay-lavender hover:brightness-95",
        clayButter:
          "clay-btn clay-butter hover:brightness-95",
        claySky:
          "clay-btn clay-sky hover:brightness-95",
        clayCoral:
          "clay-btn clay-coral hover:brightness-95",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-xl px-3.5 text-xs font-semibold",
        lg: "h-13 rounded-2xl px-7 text-base font-extrabold",
        icon: "h-11 w-11 rounded-full p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

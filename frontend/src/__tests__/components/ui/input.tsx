import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-2xl border border-[rgba(28,30,38,0.12)] bg-white px-4 py-2 text-sm font-medium text-[#1C1E26] shadow-[0_2px_8px_rgba(28,30,38,0.02)] transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#9195A8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1E26] focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };

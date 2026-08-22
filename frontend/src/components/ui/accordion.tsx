"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "@/components/ui/icons";

interface AccordionContextType {
  value: string | string[];
  onValueChange: (itemValue: string) => void;
  type: "single" | "multiple";
  collapsible?: boolean;
}

const AccordionContext = React.createContext<AccordionContextType | null>(null);

export interface AccordionProps {
  type?: "single" | "multiple";
  collapsible?: boolean;
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: any) => void;
  children: React.ReactNode;
  className?: string;
}

export function Accordion({
  type = "single",
  collapsible = true,
  defaultValue,
  value: controlledValue,
  onValueChange: setControlledValue,
  children,
  className,
}: AccordionProps) {
  const [internalValue, setInternalValue] = React.useState<string | string[]>(
    defaultValue || (type === "multiple" ? [] : "")
  );

  const isControlled = controlledValue !== undefined;
  const activeValue = isControlled ? controlledValue : internalValue;

  const handleValueChange = (itemValue: string) => {
    let nextValue: string | string[];

    if (type === "multiple") {
      const currentList = Array.isArray(activeValue) ? activeValue : [];
      if (currentList.includes(itemValue)) {
        nextValue = currentList.filter((v) => v !== itemValue);
      } else {
        nextValue = [...currentList, itemValue];
      }
    } else {
      if (activeValue === itemValue) {
        nextValue = collapsible ? "" : itemValue;
      } else {
        nextValue = itemValue;
      }
    }

    if (!isControlled) {
      setInternalValue(nextValue);
    }
    setControlledValue?.(nextValue);
  };

  return (
    <AccordionContext.Provider
      value={{
        value: activeValue,
        onValueChange: handleValueChange,
        type,
        collapsible,
      }}
    >
      <div className={cn("space-y-3", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  variant?: "default" | "clay" | "subtle" | "tinted";
}

const ItemContext = React.createContext<{
  value: string;
  isOpen: boolean;
  variant?: string;
} | null>(null);

export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, value, variant = "default", children, ...props }, ref) => {
    const context = React.useContext(AccordionContext);
    if (!context) throw new Error("AccordionItem must be used within Accordion");

    const isOpen = Array.isArray(context.value)
      ? context.value.includes(value)
      : context.value === value;

    const variantStyles = {
      default: "bg-white border border-[rgba(28,30,38,0.08)] shadow-xs",
      clay: "clay-card clay-white",
      subtle: "bg-[#F0EEF6] border border-transparent",
      tinted: "bg-[#E3DBF8]/40 border border-[#4B3B7A]/10 text-[#1C1E26]",
    };

    return (
      <ItemContext.Provider value={{ value, isOpen, variant }}>
        <div
          ref={ref}
          className={cn(
            "rounded-[22px] overflow-hidden transition-all duration-200",
            variantStyles[variant] || variantStyles.default,
            isOpen && "shadow-md",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </ItemContext.Provider>
    );
  }
);
AccordionItem.displayName = "AccordionItem";

export interface AccordionTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  subtitle?: React.ReactNode;
}

export const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  AccordionTriggerProps
>(({ className, children, icon, badge, subtitle, ...props }, ref) => {
  const accordion = React.useContext(AccordionContext);
  const item = React.useContext(ItemContext);

  if (!accordion || !item) {
    throw new Error("AccordionTrigger must be used within AccordionItem");
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => accordion.onValueChange(item.value)}
      className={cn(
        "flex w-full items-center justify-between p-4 md:p-5 text-left font-bold text-[#1C1E26] transition-all hover:bg-black/[0.02] cursor-pointer select-none",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3 min-w-0 pr-2">
        {icon && <div className="shrink-0">{icon}</div>}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm md:text-base font-black truncate text-[#1C1E26]">
              {children}
            </span>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          {subtitle && (
            <p className="text-xs text-[#5A5E70] font-normal mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <ChevronDown
        className={cn(
          "h-5 w-5 shrink-0 text-[#9195A8] transition-transform duration-200",
          item.isOpen && "rotate-180 text-[#1C1E26]"
        )}
      />
    </button>
  );
});
AccordionTrigger.displayName = "AccordionTrigger";

export const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const item = React.useContext(ItemContext);
  if (!item) throw new Error("AccordionContent must be used within AccordionItem");

  if (!item.isOpen) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "px-4 pb-5 pt-1 md:px-5 text-sm text-[#5A5E70] border-t border-[rgba(28,30,38,0.04)] animate-in fade-in-50 duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
AccordionContent.displayName = "AccordionContent";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ==========================================================================
   1. Input Component
   ========================================================================== */

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: "default" | "clay" | "subtle";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = "default",
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    const variantStyles = {
      default:
        "border-[rgba(28,30,38,0.12)] bg-white text-[#1C1E26] shadow-[0_2px_8px_rgba(28,30,38,0.02)] focus:border-[#1C1E26]",
      clay:
        "border-white/80 bg-white text-[#1C1E26] shadow-[inset_2px_2px_4px_rgba(35,38,59,0.05),0_4px_10px_rgba(35,38,59,0.04)]",
      subtle:
        "border-transparent bg-[#F0EEF6] text-[#1C1E26] focus:bg-white focus:border-[rgba(28,30,38,0.15)]",
    };

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold text-[#1C1E26]"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-[#9195A8]">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            type={type}
            className={cn(
              "flex h-11 w-full rounded-2xl border px-4 py-2 text-sm font-medium transition-all",
              "placeholder:text-[#9195A8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1E26]/10",
              "disabled:cursor-not-allowed disabled:opacity-50",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error
                ? "border-[#ba1a1a] focus-visible:ring-[#ba1a1a]/20 text-[#ba1a1a]"
                : variantStyles[variant],
              className
            )}
            ref={ref}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-[#9195A8]">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-[11px] font-bold text-[#ba1a1a]">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-[#5A5E70]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

/* ==========================================================================
   2. Textarea Component
   ========================================================================== */

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-bold text-[#1C1E26]"
          >
            {label}
          </label>
        )}

        <textarea
          id={textareaId}
          className={cn(
            "flex min-h-[90px] w-full rounded-2xl border border-[rgba(28,30,38,0.12)] bg-white px-4 py-3 text-sm font-medium text-[#1C1E26] shadow-[0_2px_8px_rgba(28,30,38,0.02)] transition-all",
            "placeholder:text-[#9195A8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1E26]/10 focus:border-[#1C1E26]",
            "disabled:cursor-not-allowed disabled:opacity-50 resize-y",
            error && "border-[#ba1a1a] focus-visible:ring-[#ba1a1a]/20",
            className
          )}
          ref={ref}
          {...props}
        />

        {error ? (
          <p className="text-[11px] font-bold text-[#ba1a1a]">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-[#5A5E70]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

/* ==========================================================================
   3. Select Component
   ========================================================================== */

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: { value: string | number; label: string }[];
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, children, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-bold text-[#1C1E26]"
          >
            {label}
          </label>
        )}

        <select
          id={selectId}
          className={cn(
            "flex h-11 w-full rounded-2xl border border-[rgba(28,30,38,0.12)] bg-white px-4 py-2 text-sm font-medium text-[#1C1E26] shadow-[0_2px_8px_rgba(28,30,38,0.02)] transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1E26]/10 focus:border-[#1C1E26]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[#ba1a1a]",
            className
          )}
          ref={ref}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        {error ? (
          <p className="text-[11px] font-bold text-[#ba1a1a]">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-[#5A5E70]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Select.displayName = "Select";

/* ==========================================================================
   4. FormField Wrapper Component
   ========================================================================== */

export function FormField({
  label,
  error,
  helperText,
  children,
  className,
}: {
  label?: string;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full space-y-1.5 text-left", className)}>
      {label && (
        <label className="block text-xs font-bold text-[#1C1E26]">{label}</label>
      )}
      {children}
      {error ? (
        <p className="text-[11px] font-bold text-[#ba1a1a]">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-[#5A5E70]">{helperText}</p>
      ) : null}
    </div>
  );
}

export { Input, Textarea, Select };

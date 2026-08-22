import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-[28px] transition-all select-none",
  {
    variants: {
      variant: {
        default:
          "bg-white border border-[rgba(28,30,38,0.08)] shadow-[0_4px_16px_rgba(28,30,38,0.04)] hover:shadow-[0_8px_24px_rgba(28,30,38,0.06)]",
        mint:
          "bg-[#D1EBE1] border border-[rgba(29,94,77,0.12)] text-[#1D5E4D] shadow-[0_4px_16px_rgba(29,94,77,0.04)]",
        lavender:
          "bg-[#E3DBF8] border border-[rgba(75,59,122,0.12)] text-[#4B3B7A] shadow-[0_4px_16px_rgba(75,59,122,0.04)]",
        butter:
          "bg-[#FEE7B3] border border-[rgba(120,83,8,0.12)] text-[#785308] shadow-[0_4px_16px_rgba(120,83,8,0.04)]",
        sky:
          "bg-[#D2E5FA] border border-[rgba(33,81,138,0.12)] text-[#21518A] shadow-[0_4px_16px_rgba(33,81,138,0.04)]",
        coral:
          "bg-[#FCD9D7] border border-[rgba(133,44,40,0.12)] text-[#852C28] shadow-[0_4px_16px_rgba(133,44,40,0.04)]",
        subtle:
          "bg-[#F0EEF6] border border-[rgba(28,30,38,0.06)] text-[#1C1E26]",
        dark:
          "bg-[#1C1E26] border border-[#2A2D39] text-white shadow-[0_6px_20px_rgba(0,0,0,0.12)]",
        
        /* Claymorphic 3D Variants */
        clayWhite:
          "clay-card text-[#1C1E26]",
        clayMint:
          "clay-card clay-mint",
        clayLavender:
          "clay-card clay-lavender",
        clayButter:
          "clay-card clay-butter",
        claySky:
          "clay-card clay-sky",
        clayCoral:
          "clay-card clay-coral",
        clayDark:
          "clay-card clay-dark",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-bold leading-tight tracking-tight text-[#1C1E26]",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm font-medium text-[#5A5E70]", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };

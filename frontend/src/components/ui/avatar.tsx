"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import {
  Eye,
  Headphones,
  FlaskConical,
  GraduationCap,
  Users,
  Star,
  ShieldCheck,
} from "@/components/ui/icons";

const avatarVariants = cva(
  "relative inline-flex shrink-0 overflow-visible rounded-full select-none",
  {
    variants: {
      size: {
        xs: "h-6 w-6 text-[10px]",
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
        xl: "h-16 w-16 text-lg",
        "2xl": "h-20 w-20 text-2xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, size, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(avatarVariants({ size }), className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full rounded-full object-cover", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & {
    variant?: "default" | "mint" | "lavender" | "butter" | "sky" | "coral" | "dark";
  }
>(({ className, variant = "lavender", ...props }, ref) => {
  const variantStyles = {
    default: "bg-[#F0EEF6] text-[#1C1E26]",
    mint: "bg-[#D1EBE1] text-[#1D5E4D]",
    lavender: "bg-[#E3DBF8] text-[#4B3B7A]",
    butter: "bg-[#FEE7B3] text-[#785308]",
    sky: "bg-[#D2E5FA] text-[#21518A]",
    coral: "bg-[#FCD9D7] text-[#852C28]",
    dark: "bg-[#1C1E26] text-white",
  };

  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full font-black border border-white/60 shadow-xs",
        variantStyles[variant] || variantStyles.lavender,
        className
      )}
      {...props}
    />
  );
});
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

/* ==========================================================================
   Modular AvatarIcon Component with Status & Modality Overlays
   ========================================================================== */

export interface AvatarIconProps {
  src?: string;
  name?: string;
  role?: "SISWA" | "GURU" | "ORANG_TUA" | string;
  modality?: "VISUAL" | "AUDITORI" | "KINESTETIK" | string;
  status?: "online" | "offline" | "learning" | "busy";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  variant?: "default" | "mint" | "lavender" | "butter" | "sky" | "coral" | "dark" | "clay";
  showBadge?: boolean;
  className?: string;
}

export function AvatarIcon({
  src,
  name = "User",
  role,
  modality,
  status,
  size = "md",
  variant = "lavender",
  showBadge = true,
  className,
}: AvatarIconProps) {
  const getInitials = (n: string) => {
    return n
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getModalityColor = () => {
    switch (modality) {
      case "AUDITORI":
        return "lavender";
      case "KINESTETIK":
        return "butter";
      case "VISUAL":
      default:
        return "mint";
    }
  };

  const selectedVariant = variant === "clay" ? (getModalityColor() as any) : variant;

  const renderBadgeIcon = () => {
    if (modality === "AUDITORI") return <Headphones className="w-2.5 h-2.5" />;
    if (modality === "KINESTETIK") return <FlaskConical className="w-2.5 h-2.5" />;
    if (modality === "VISUAL") return <Eye className="w-2.5 h-2.5" />;
    if (role === "GURU") return <GraduationCap className="w-2.5 h-2.5" />;
    if (role === "ORANG_TUA") return <Users className="w-2.5 h-2.5" />;
    return <Star className="w-2.5 h-2.5" />;
  };

  const statusClasses = {
    online: "bg-[#1D5E4D] ring-white",
    learning: "bg-[#FEE7B3] text-[#785308] ring-white",
    busy: "bg-[#ba1a1a] ring-white",
    offline: "bg-[#9195A8] ring-white",
  };

  return (
    <div className="relative inline-flex shrink-0">
      <Avatar size={size} className={cn(variant === "clay" && "clay-card clay-white", className)}>
        {src && <AvatarImage src={src} alt={name} />}
        <AvatarFallback variant={selectedVariant}>
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>

      {/* Status Dot */}
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-white shadow-xs",
            size === "xs" || size === "sm" ? "w-2 h-2" : "w-3 h-3",
            statusClasses[status]
          )}
        />
      )}

      {/* Role / Modality Floating Badge */}
      {!status && showBadge && (modality || role) && size !== "xs" && (
        <span className="absolute -bottom-1 -right-1 bg-white text-[#1C1E26] rounded-full p-0.5 border border-[rgba(28,30,38,0.1)] shadow-xs flex items-center justify-center">
          {renderBadgeIcon()}
        </span>
      )}
    </div>
  );
}

export { Avatar, AvatarImage, AvatarFallback };

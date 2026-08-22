import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, X } from "@/components/ui/icons";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  variant?: "default" | "clay";
  showCloseButton?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  full: "max-w-4xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  variant = "default",
  className,
}: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          sizeClasses[size],
          variant === "clay" ? "clay-card clay-white border-2 border-white/80" : "bg-white",
          className
        )}
      >
        {(title || description) && (
          <DialogHeader>
            {title && (
              <DialogTitle className="text-lg md:text-xl font-black text-[#1C1E26]">
                {title}
              </DialogTitle>
            )}
            {description && (
              <DialogDescription className="text-xs md:text-sm text-[#5A5E70]">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        )}

        <div className="py-2">{children}</div>

        {footer && <DialogFooter className="gap-2 pt-2">{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

export interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "primary" | "danger" | "mint" | "butter";
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = "Konfirmasi",
  cancelText = "Batal",
  variant = "primary",
  isLoading = false,
  icon,
}: ConfirmModalProps) {
  const getButtonVariant = () => {
    switch (variant) {
      case "danger":
        return "destructive";
      case "mint":
        return "mint";
      case "butter":
        return "butter";
      default:
        return "default";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      size="sm"
      variant="clay"
      className="p-6"
    >
      <div className="flex flex-col items-center text-center space-y-4 pt-2">
        {icon ? (
          <div className="shrink-0">{icon}</div>
        ) : variant === "danger" ? (
          <div className="w-12 h-12 rounded-full bg-[#FCD9D7] text-[#852C28] flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-[#D1EBE1] text-[#1D5E4D] flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        )}

        <div className="space-y-1.5">
          <h3 className="text-lg font-black text-[#1C1E26]">{title}</h3>
          <p className="text-xs text-[#5A5E70] leading-relaxed">{message}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={getButtonVariant()}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
            className="rounded-xl"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

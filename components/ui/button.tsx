import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "action" | "secondary" | "outline" | "ghost" | "danger" | "subtle";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variantStyles = {
    action:
      "bg-[#D9272E] hover:bg-[#C21F25] active:bg-[#A8171C] text-white shadow-[0_2px_8px_rgba(217,39,46,0.25)] hover:shadow-[0_4px_12px_rgba(217,39,46,0.35)] border border-transparent font-semibold tracking-wide",
    primary:
      "bg-[#3D084B] hover:bg-[#32063E] active:bg-[#260430] text-white shadow-subtle hover:shadow-card border border-transparent font-semibold tracking-wide",
    secondary:
      "bg-[#FCEEEF] hover:bg-[#F8D4D6] active:bg-[#F0C2C5] text-[#D9272E] border border-[#F8D4D6] font-semibold",
    outline:
      "bg-white hover:bg-[#F8FAFC] text-[#252B38] border border-[#E8EBF0] hover:border-[#8993A4] font-semibold shadow-subtle",
    ghost:
      "bg-transparent hover:bg-[#F8FAFC] text-[#252B38] hover:text-[#D9272E] border border-transparent font-medium",
    danger:
      "bg-rose-700 hover:bg-rose-800 active:bg-rose-900 text-white shadow-subtle border border-transparent font-semibold",
    subtle:
      "bg-[#FCEEEF]/70 hover:bg-[#FCEEEF] text-[#3D084B] hover:text-[#D9272E] border border-[#E8EBF0] font-medium",
  };

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 rounded-xl gap-1.5",
    md: "text-xs font-semibold px-4 py-2.5 rounded-xl gap-2",
    lg: "text-sm font-semibold px-5 py-3 rounded-2xl gap-2.5",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D084B]/25 select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Processing...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

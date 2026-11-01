import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
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
    primary: "bg-studio-600 hover:bg-studio-700 text-white shadow-subtle hover:shadow border border-transparent",
    secondary: "bg-[#FAF7F2] hover:bg-[#F3EFE6] text-charcoal-800 border border-[#E8DFD3]",
    outline: "bg-transparent hover:bg-cream-100 text-charcoal-700 border border-[#E8DFD3]",
    ghost: "bg-transparent hover:bg-cream-100 text-charcoal-700 border border-transparent",
    danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-subtle border border-transparent",
  };

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 rounded-lg",
    md: "text-xs font-semibold px-4 py-2.5 rounded-lg",
    lg: "text-sm font-semibold px-5 py-3 rounded-xl",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

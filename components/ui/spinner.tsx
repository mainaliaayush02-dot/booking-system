import React from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

export function Spinner({ size = "md", className, label }: SpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-8 h-8 border-3",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div
        className={cn(
          "rounded-full border-studio-200 border-t-studio-600 animate-spin",
          sizeClasses[size],
          className
        )}
      />
      {label && <p className="text-xs text-charcoal-500 font-medium">{label}</p>}
    </div>
  );
}

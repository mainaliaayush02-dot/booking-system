import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-white rounded-xl border border-[#EFE8DC]",
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-studio-50 border border-studio-200 flex items-center justify-center text-studio-600 mb-4 shadow-subtle">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="font-serif text-base font-semibold text-charcoal-900">{title}</h4>
      <p className="text-xs text-charcoal-500 mt-1.5 max-w-sm leading-relaxed">{description}</p>
      {action && (
        <div className="mt-5">
          {action.href ? (
            <a
              href={action.href}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-studio-600 hover:bg-studio-700 text-white text-xs font-semibold tracking-wide transition-all shadow-subtle"
            >
              {action.label}
            </a>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-studio-600 hover:bg-studio-700 text-white text-xs font-semibold tracking-wide transition-all shadow-subtle"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

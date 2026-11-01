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
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-[#FFFAFC] rounded-2xl border border-[#EBD8E1]",
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#FAF2F7] border border-[#EBD8E1] flex items-center justify-center text-[#3D084B] mb-4 shadow-subtle">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="font-serif text-base font-semibold text-[#3D084B]">{title}</h4>
      <p className="text-xs text-[#846F7F] mt-1.5 max-w-sm leading-relaxed">{description}</p>
      {action && (
        <div className="mt-5">
          {action.href ? (
            <a
              href={action.href}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3D084B] hover:bg-[#32063E] text-white text-xs font-semibold tracking-wide transition-all shadow-subtle"
            >
              {action.label}
            </a>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3D084B] hover:bg-[#32063E] text-white text-xs font-semibold tracking-wide transition-all shadow-subtle"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

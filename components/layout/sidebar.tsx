"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Package,
  Receipt,
  BarChart3,
  Settings,
  Camera,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const navItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Booking Calendar",
    href: "/calendar",
    icon: Calendar,
  },
  {
    name: "Clients",
    href: "/clients",
    icon: Users,
  },
  {
    name: "Packages",
    href: "/packages",
    icon: Package,
  },
  {
    name: "Accounts & Finance",
    href: "/finance",
    icon: Receipt,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-charcoal-900/30 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#FBF9F5] border-r border-[#EFE8DC] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="h-20 px-6 border-b border-[#EFE8DC] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-studio-500/10 border border-studio-500/20 flex items-center justify-center text-studio-600 transition-colors group-hover:bg-studio-500/15">
              <Camera className="w-5 h-5 text-studio-600" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-base font-semibold tracking-tight text-charcoal-900 leading-tight">
                Newborn Photo
              </span>
              <span className="text-[10px] tracking-widest uppercase text-studio-600 font-semibold">
                Nepal • Studio
              </span>
            </div>
          </Link>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-charcoal-500 hover:bg-cream-200 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-6 overflow-y-auto space-y-1">
          <div className="px-3 pb-2">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-charcoal-400">
              Studio Workspace
            </p>
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  isActive
                    ? "bg-[#EFE8DC] text-studio-800 font-semibold shadow-subtle"
                    : "text-charcoal-600 hover:bg-[#F3ECE1] hover:text-charcoal-900"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-studio-700" : "text-charcoal-400 group-hover:text-charcoal-700"
                  )}
                />
                <span>{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-studio-600" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-[#EFE8DC] bg-[#FAF6F0]">
          <div className="rounded-lg border border-[#E9E1D4] bg-white/70 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-charcoal-700">Studio System</span>
            </div>
            <span className="text-[10px] font-mono font-medium text-studio-600 bg-studio-50 border border-studio-200 px-1.5 py-0.5 rounded">
              Kathmandu
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}


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
          className="fixed inset-0 z-40 bg-[#3D084B]/30 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#FFFAFC] border-r border-[#EBD8E1] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static shadow-subtle",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header with Official Studio Logo */}
        <div className="h-24 px-4 border-b border-[#EBD8E1] flex items-center justify-between bg-[#FBF2F6]/70 shrink-0">
          <Link href="/" className="flex items-center gap-3 w-full group py-1" onClick={onCloseMobile}>
            <div className="relative w-13 h-13 overflow-hidden rounded-2xl bg-white border border-[#EBD8E1] p-1 flex items-center justify-center shadow-subtle group-hover:border-[#D6A3C7] transition-all shrink-0">
              <img
                src="/brand/logo.jpg"
                alt="Newborn Photography Nepal by Navin"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-serif font-bold text-sm text-[#3D084B] leading-tight truncate group-hover:text-[#68456E] transition-colors">
                Newborn Photography
              </span>
              <span className="text-[11px] text-[#846F7F] font-medium leading-tight truncate mt-0.5">
                Nepal • By Navin
              </span>
              <span className="text-[9px] uppercase tracking-wider font-bold text-[#68456E] mt-1 bg-[#F5E5EB] px-1.5 py-0.5 rounded-md inline-block w-fit border border-[#EBD8E1]">
                Studio Manager
              </span>
            </div>
          </Link>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-[#68456E] hover:bg-[#F5E5EB] transition-colors ml-1 shrink-0"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3.5 py-5 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#846F7F]">
              Studio Navigation
            </p>
            <span className="text-[10px] text-[#68456E] font-medium font-serif italic">Kathmandu</span>
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
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D084B]/20",
                  isActive
                    ? "bg-[#F5E5EB] text-[#3D084B] shadow-subtle border border-[#EBD8E1]"
                    : "text-[#332A34] hover:bg-[#FAF2F7] hover:text-[#3D084B]"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors shrink-0",
                    isActive ? "text-[#3D084B]" : "text-[#846F7F] group-hover:text-[#3D084B]"
                  )}
                />
                <span className="truncate">{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#3D084B] shrink-0" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Studio Status Footer */}
        <div className="p-4 border-t border-[#EBD8E1] bg-[#FAF2F7]/50 shrink-0">
          <div className="rounded-xl border border-[#EBD8E1] bg-white p-3 flex items-center justify-between shadow-subtle">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-[#3D084B] truncate">Studio Portal</span>
                <span className="text-[10px] text-[#846F7F] truncate">Asia/Kathmandu</span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#68456E] bg-[#F5E5EB] border border-[#EBD8E1] px-2 py-0.5 rounded-full shrink-0">
              NPT
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

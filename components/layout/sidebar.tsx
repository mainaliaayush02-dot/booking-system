"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
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
        {/* Brand Header with Official Logo */}
        <div className="h-24 px-5 border-b border-[#EBD8E1] flex items-center justify-between bg-[#FBF2F6]/60">
          <Link href="/" className="flex items-center gap-3 w-full group py-2">
            <div className="relative w-full h-14 overflow-hidden rounded-xl bg-white border border-[#EBD8E1] p-1 flex items-center justify-center shadow-subtle group-hover:border-[#D6A3C7] transition-all">
              <img
                src="/brand/logo.jpg"
                alt="Newborn Photography Nepal by Navin"
                className="w-full h-full object-contain"
              />
            </div>
          </Link>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-[#68456E] hover:bg-[#F5E5EB] transition-colors ml-2 shrink-0"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3.5 py-6 overflow-y-auto space-y-1.5">
          <div className="px-3 pb-2 flex items-center justify-between">
            <p className="text-[11px] font-bold tracking-wider uppercase text-[#846F7F]">
              Studio Portal
            </p>
            <span className="text-[10px] text-[#68456E] font-medium">By Navin</span>
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
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group",
                  isActive
                    ? "bg-[#F5E5EB] text-[#3D084B] font-bold shadow-subtle border border-[#EBD8E1]"
                    : "text-[#332A34] hover:bg-[#FAF2F7] hover:text-[#3D084B]"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-[#3D084B]" : "text-[#846F7F] group-hover:text-[#3D084B]"
                  )}
                />
                <span>{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#3D084B]" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Studio Status Footer */}
        <div className="p-4 border-t border-[#EBD8E1] bg-[#FAF2F7]/50">
          <div className="rounded-xl border border-[#EBD8E1] bg-white p-3 flex items-center justify-between shadow-subtle">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-[#3D084B]">Studio System</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#68456E] bg-[#F5E5EB] border border-[#EBD8E1] px-2 py-0.5 rounded-full">
              Kathmandu
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

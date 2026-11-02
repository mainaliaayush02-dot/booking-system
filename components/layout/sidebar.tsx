"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/firebase-auth";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Package,
  Receipt,
  BarChart3,
  Settings,
  X,
  LogOut,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const navSections = [
  {
    title: "Operations",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Booking Calendar", href: "/calendar", icon: Calendar },
      { name: "Clients", href: "/clients", icon: Users },
      { name: "Packages", href: "/packages", icon: Package },
    ],
  },
  {
    title: "Finance & Reports",
    items: [
      { name: "Accounts & Finance", href: "/finance", icon: Receipt },
      { name: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { studioUser, signOut, isAdmin } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#3D084B]/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container - Exactly 250px on desktop */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-[250px] bg-white border-r border-[#EBD8E1] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen shrink-0 shadow-subtle select-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header with Official Studio Logo */}
        <div className="h-[72px] px-3.5 border-b border-[#F0E2EB] flex items-center justify-between bg-[#FDFBFD] shrink-0">
          <Link href="/" className="flex items-center gap-2.5 min-w-0 group py-1" onClick={onCloseMobile}>
            <div className="relative w-11 h-11 min-w-[44px] max-w-[44px] min-h-[44px] max-h-[44px] overflow-hidden rounded-xl bg-white border border-[#EBD8E1] p-1 flex items-center justify-center shadow-subtle group-hover:border-[#3D084B]/40 transition-all shrink-0">
              <img
                src="/brand/logo.jpg"
                alt="Newborn Photography Nepal by Navin"
                width={42}
                height={42}
                className="w-full h-full max-w-full max-h-full object-contain rounded-lg aspect-square"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-serif font-bold text-sm text-[#3D084B] leading-tight truncate group-hover:text-[#68456E] transition-colors">
                Newborn Photography
              </span>
              <span className="text-[10px] text-[#7D6677] font-medium leading-tight truncate mt-0.5">
                Nepal • By Navin
              </span>
              <span className="text-[9px] uppercase tracking-wider font-bold text-[#68456E] mt-0.5 inline-block w-fit">
                Studio Manager
              </span>
            </div>
          </Link>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-[#7D6677] hover:bg-[#F5E5EB] transition-colors ml-1 shrink-0"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Grouped Navigation Items */}
        <div className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-2.5 py-1">
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#7D6677]/80">
                  {section.title}
                </p>
              </div>

              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D084B]/20",
                      isActive
                        ? "bg-[#3D084B] text-white shadow-subtle"
                        : "text-[#2D232F] hover:bg-[#FAF2F7] hover:text-[#3D084B]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 transition-colors shrink-0",
                        isActive ? "text-white" : "text-[#7D6677] group-hover:text-[#3D084B]"
                      )}
                    />
                    <span className="truncate">{item.name}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Profile & Role Footer */}
        <div className="p-3 border-t border-[#F0E2EB] bg-[#FDFBFD] shrink-0">
          <div className="rounded-xl border border-[#EBD8E1] bg-white p-2.5 flex items-center justify-between shadow-subtle">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#FAF2F7] border border-[#EBD8E1] flex items-center justify-center text-[#3D084B] font-bold text-xs shrink-0">
                {studioUser?.displayName?.[0]?.toUpperCase() || "N"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-[#2D232F] truncate">
                  {studioUser?.displayName || "Studio Admin"}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={cn(
                    "text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded-md border",
                    isAdmin
                      ? "bg-[#FAF2F7] text-[#3D084B] border-[#D6A3C7]"
                      : "bg-neutral-50 text-neutral-700 border-neutral-200"
                  )}>
                    {studioUser?.role || "Staff"}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Online" />
                </div>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              title="Sign Out"
              className="p-1.5 rounded-lg text-[#7D6677] hover:text-rose-700 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/firebase-auth";
import {
  Calendar,
  Users,
  UserPlus,
  Heart,
  LayoutGrid,
  Trash2,
  Package,
  Receipt,
  BarChart3,
  Settings,
  Contact,
  X,
  LogOut,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

// Primary navigation matching Clarity layout
const primaryNavItems = [
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Sessions", href: "/sessions", icon: Users },
  { name: "Leads", href: "/leads", icon: UserPlus },
  { name: "Follow-ups", href: "/follow-ups", icon: Heart },
  { name: "Dashboard", href: "/", icon: LayoutGrid },
  { name: "Trash", href: "/trash", icon: Trash2 },
];

// Extended Studio Management items
const studioNavItems = [
  { name: "Clients", href: "/clients", icon: Contact },
  { name: "Packages", href: "/packages", icon: Package },
  { name: "Finance", href: "/finance", icon: Receipt },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { studioUser, signOut, isAdmin } = useAuth();
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar / Drawer Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-[275px] sm:w-[290px] bg-white border-r border-[#E8EBF0] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen shrink-0 shadow-lg lg:shadow-none select-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Top: Studio Branding & Close Button */}
        <div className="h-16 px-4 border-b border-[#E8EBF0] flex items-center justify-between bg-white shrink-0">
          <Link href="/" className="flex items-center gap-2.5 min-w-0" onClick={onCloseMobile}>
            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-white border border-[#E8EBF0] p-0.5 flex items-center justify-center shrink-0">
              <img
                src="/brand/logo.jpg"
                alt="Newborn Photography Nepal"
                width={30}
                height={30}
                className="w-full h-full object-contain rounded"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-sans font-bold text-base text-[#252B38] tracking-tight truncate">
                Newborn Photography
              </span>
              <span className="text-[10px] text-[#8993A4] leading-tight truncate">
                Studio Manager • By Navin
              </span>
            </div>
          </Link>

          {/* Close Icon on Top Right of Drawer */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-xl text-[#8993A4] hover:text-[#252B38] hover:bg-[#F8FAFC] transition-colors ml-1 shrink-0 cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items (Clarity layout style) */}
        <div className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          {primaryNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9272E]/20",
                  isActive
                    ? "bg-[#FCEEEF] text-[#D9272E] font-bold"
                    : "text-[#252B38] hover:bg-[#F8FAFC]"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-colors shrink-0",
                    isActive ? "text-[#D9272E]" : "text-[#8993A4] group-hover:text-[#252B38]"
                  )}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}

          {/* Collapsible / Extended Studio Management Section */}
          <div className="pt-3 mt-2 border-t border-[#E8EBF0]">
            <button
              type="button"
              onClick={() => setShowMore(!showMore)}
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-[#8993A4] hover:text-[#252B38] rounded-xl hover:bg-[#F8FAFC] transition-colors"
            >
              <span className="uppercase tracking-wider text-[10px]">Studio Operations</span>
              {showMore ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showMore && (
              <div className="mt-1 space-y-1 animate-in fade-in duration-200">
                {studioNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      className={cn(
                        "flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all group",
                        isActive
                          ? "bg-[#FCEEEF] text-[#D9272E] font-bold"
                          : "text-[#252B38] hover:bg-[#F8FAFC]"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-4 h-4 transition-colors shrink-0",
                          isActive ? "text-[#D9272E]" : "text-[#8993A4] group-hover:text-[#252B38]"
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Drawer Footer: User Profile & Sign Out */}
        <div className="p-3 border-t border-[#E8EBF0] bg-white shrink-0 space-y-2">
          {/* User Info Card */}
          <div className="rounded-2xl border border-[#E8EBF0] bg-[#F8FAFC] p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#FCEEEF] border border-[#EAD1DC] flex items-center justify-center text-[#D9272E] font-bold text-xs shrink-0">
                {studioUser?.displayName?.[0]?.toUpperCase() || "N"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-[#252B38] truncate">
                  {studioUser?.displayName || "Studio Admin"}
                </span>
                <span className="text-[10px] text-[#8993A4] capitalize">
                  {studioUser?.role || "Staff"}
                </span>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Online" />
          </div>

          {/* Sign Out Button */}
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#8993A4] hover:text-[#D9272E] hover:bg-[#FCEEEF] transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/firebase-auth";
import {
  CalendarDays,
  LogOut,
  Menu,
  ShieldCheck,
  ChevronDown,
  Settings,
  Clock,
  Sparkles,
  Plus,
} from "lucide-react";
import { NEPAL_TIMEZONE } from "@/lib/utils";

interface TopNavProps {
  onOpenMobileMenu?: () => void;
}

const PAGE_METADATA: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Dashboard Overview",
    subtitle: "Real-time bookings, studio revenue & schedule overview",
  },
  "/calendar": {
    title: "Booking Calendar",
    subtitle: "Interactive photography schedule & appointment manager",
  },
  "/clients": {
    title: "Client Directory",
    subtitle: "Family profiles, baby milestones & previous sessions",
  },
  "/packages": {
    title: "Photography Packages",
    subtitle: "Studio pricing collections, durations & package inclusions",
  },
  "/finance": {
    title: "Accounts & Finance",
    subtitle: "Cash collection, advances, remaining dues & studio expenses",
  },
  "/reports": {
    title: "Business Reports",
    subtitle: "Performance trends, session volumes & data exports",
  },
  "/settings": {
    title: "Studio Settings",
    subtitle: "System configuration, team administration & infrastructure",
  },
};

export function TopNav({ onOpenMobileMenu }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { studioUser, signOut, isAdmin } = useAuth();
  const [nepalDate, setNepalDate] = useState<string>("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: NEPAL_TIMEZONE,
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const timeFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: NEPAL_TIMEZONE,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      setNepalDate(`${dateFormatter.format(now)} • ${timeFormatter.format(now)}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      router.replace("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const meta = PAGE_METADATA[pathname] || {
    title: "Studio Manager",
    subtitle: "Newborn Photography Nepal by Navin",
  };

  return (
    <header className="h-[72px] bg-[#FFFAFC]/95 backdrop-blur-md border-b border-[#EBD8E1] sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shrink-0">
      {/* Left: Mobile trigger & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-[#68456E] hover:bg-[#F5E5EB] border border-[#EBD8E1] transition-colors shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#3D084B] tracking-tight truncate">
            {meta.title}
          </h1>
          <p className="text-xs text-[#846F7F] hidden sm:block truncate font-normal">
            {meta.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Nepal Date & User Profile Dropdown Menu */}
      <div className="flex items-center gap-2.5 sm:gap-5 shrink-0">
        {/* Nepal Date Badge */}
        <div className="hidden md:flex items-center gap-2 bg-[#F5E5EB] border border-[#EBD8E1] px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#3D084B] shadow-subtle">
          <CalendarDays className="w-3.5 h-3.5 text-[#3D084B]" />
          <span>{nepalDate || "Kathmandu Studio"}</span>
          <span className="text-[10px] text-[#3D084B] font-mono font-bold uppercase bg-white px-1.5 py-0.5 rounded-md border border-[#EBD8E1]">
            NPT
          </span>
        </div>

        {/* Quick Action */}
        <Link
          href="/calendar"
          className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#3D084B] text-white text-xs font-semibold hover:bg-[#521363] active:scale-[0.98] transition-all shadow-subtle"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Booking</span>
        </Link>

        {/* User Profile Menu Dropdown */}
        <div className="relative border-l border-[#EBD8E1] pl-3 sm:pl-5" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-2xl hover:bg-[#F5E5EB]/70 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3D084B]/20"
            aria-expanded={isProfileMenuOpen}
            aria-haspopup="true"
          >
            <div className="w-9 h-9 rounded-full bg-[#F3E2EE] border border-[#D6A3C7] flex items-center justify-center text-[#3D084B] font-serif font-bold text-sm shadow-subtle shrink-0">
              {studioUser?.displayName ? studioUser.displayName.charAt(0).toUpperCase() : "S"}
            </div>
            <div className="hidden sm:flex flex-col text-left min-w-0 max-w-[130px]">
              <span className="text-xs font-bold text-[#332A34] leading-tight truncate">
                {studioUser?.displayName || "Studio Staff"}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[9px] uppercase font-bold tracking-wider text-[#68456E]">
                  {studioUser?.role || "Staff"}
                </span>
                {isAdmin && (
                  <ShieldCheck className="w-3 h-3 text-[#3D084B]" />
                )}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#846F7F] hidden sm:block shrink-0" />
          </button>

          {/* Dropdown Menu Popup */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-[#FFFAFC] rounded-3xl border border-[#EBD8E1] shadow-float py-2 z-50 animate-modal">
              <div className="px-4 py-3.5 border-b border-[#EBD8E1] bg-[#FAF2F7]/50">
                <p className="text-xs font-bold text-[#3D084B] leading-tight">
                  {studioUser?.displayName || "Studio Staff"}
                </p>
                <p className="text-[11px] text-[#846F7F] truncate mt-0.5 font-mono">
                  {studioUser?.email || "staff@newbornphotonepal.com"}
                </p>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#F5E5EB] text-[#3D084B] border border-[#EBD8E1]">
                    Role: {studioUser?.role || "Staff"}
                  </span>
                  <span className="text-[10px] text-emerald-800 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active Session
                  </span>
                </div>
              </div>

              <div className="py-1">
                <Link
                  href="/settings"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="w-full px-4 py-2.5 text-xs text-[#332A34] hover:bg-[#FAF2F7] hover:text-[#3D084B] flex items-center gap-2.5 transition-colors font-medium"
                >
                  <Settings className="w-4 h-4 text-[#846F7F]" />
                  <span>Studio Settings & Team</span>
                </Link>
                <Link
                  href="/calendar"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="w-full px-4 py-2.5 text-xs text-[#332A34] hover:bg-[#FAF2F7] hover:text-[#3D084B] flex items-center gap-2.5 transition-colors font-medium"
                >
                  <CalendarDays className="w-4 h-4 text-[#846F7F]" />
                  <span>Booking Calendar</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-[#EBD8E1]">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full px-4 py-2.5 text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 transition-colors font-semibold text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{isLoggingOut ? "Signing out..." : "Sign Out of Studio Portal"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

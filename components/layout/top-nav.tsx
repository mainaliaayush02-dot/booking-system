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
  "/sessions": {
    title: "Photography Sessions",
    subtitle: "Session schedules, client assignments & deliverable tracking",
  },
  "/leads": {
    title: "Client Leads & Inquiries",
    subtitle: "Inquiry pipeline, baby due dates & conversion tracking",
  },
  "/follow-ups": {
    title: "Studio Follow-ups",
    subtitle: "Milestone preparation calls, gallery proofing & client check-ins",
  },
  "/trash": {
    title: "Trash & Archive",
    subtitle: "Safely archived photography packages & cancelled records",
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
    <header className="h-16 bg-white border-b border-[#E8EBF0] sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shrink-0">
      {/* Mobile Branding (Small logo + Name on left) */}
      <div className="flex items-center gap-2.5 lg:hidden min-w-0">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
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
            <span className="font-sans font-bold text-sm text-[#252B38] leading-tight truncate">
              Newborn Photography
            </span>
            <span className="text-[10px] text-[#8993A4] leading-tight truncate">
              Studio Portal • By Navin
            </span>
          </div>
        </Link>
      </div>

      {/* Desktop Page Title (Hidden on mobile) */}
      <div className="hidden lg:flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <h1 className="font-sans text-xl font-bold text-[#252B38] tracking-tight truncate">
            {meta.title}
          </h1>
          <p className="text-xs text-[#8993A4] truncate font-normal">
            {meta.subtitle}
          </p>
        </div>
      </div>

      {/* Mobile Hamburger on Right */}
      <div className="lg:hidden flex items-center gap-2">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="p-2 rounded-xl text-[#252B38] hover:bg-[#F8FAFC] border border-[#E8EBF0] transition-colors shrink-0 cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Desktop Actions: Nepal Date & User Profile Dropdown Menu */}
      <div className="hidden lg:flex items-center gap-3.5 sm:gap-5 shrink-0">
        {/* Nepal Date Badge */}
        <div className="flex items-center gap-2 bg-[#FCEEEF] border border-[#E8EBF0] px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#D9272E] shadow-subtle">
          <CalendarDays className="w-3.5 h-3.5 text-[#D9272E]" />
          <span>{nepalDate || "Kathmandu Studio"}</span>
          <span className="text-[10px] text-[#252B38] font-mono font-bold uppercase bg-white px-1.5 py-0.5 rounded-md border border-[#E8EBF0]">
            NPT
          </span>
        </div>

        {/* Primary Action */}
        <Link
          href="/calendar"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#D9272E] text-white text-xs font-semibold hover:bg-[#C21F25] active:scale-[0.98] transition-all shadow-subtle"
        >
          <Plus className="w-4 h-4" />
          <span>New Photography Booking</span>
        </Link>

        {/* User Profile Menu Dropdown */}
        <div className="relative border-l border-[#E8EBF0] pl-4" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-2xl hover:bg-[#F8FAFC] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9272E]/20 cursor-pointer"
            aria-expanded={isProfileMenuOpen}
            aria-haspopup="true"
          >
            <div className="w-9 h-9 rounded-full bg-[#FCEEEF] border border-[#EAD1DC] flex items-center justify-center text-[#D9272E] font-bold text-sm shadow-subtle shrink-0">
              {studioUser?.displayName ? studioUser.displayName.charAt(0).toUpperCase() : "N"}
            </div>
            <div className="flex flex-col text-left min-w-0 max-w-[130px]">
              <span className="text-xs font-bold text-[#252B38] leading-tight truncate">
                {studioUser?.displayName || "Studio Staff"}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[9px] uppercase font-bold tracking-wider text-[#8993A4]">
                  {studioUser?.role || "Staff"}
                </span>
                {isAdmin && (
                  <ShieldCheck className="w-3 h-3 text-[#3D084B]" />
                )}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#8993A4] shrink-0" />
          </button>

          {/* Dropdown Menu Popup */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-3xl border border-[#E8EBF0] shadow-float py-2 z-50 animate-modal">
              <div className="px-4 py-3.5 border-b border-[#E8EBF0] bg-[#F8FAFC]">
                <p className="text-xs font-bold text-[#252B38] leading-tight">
                  {studioUser?.displayName || "Studio Staff"}
                </p>
                <p className="text-[11px] text-[#8993A4] truncate mt-0.5 font-mono">
                  {studioUser?.email || "staff@newbornphotonepal.com"}
                </p>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#FCEEEF] text-[#D9272E] border border-[#E8EBF0]">
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
                  className="w-full px-4 py-2.5 text-xs text-[#252B38] hover:bg-[#F8FAFC] hover:text-[#D9272E] flex items-center gap-2.5 transition-colors font-medium"
                >
                  <Settings className="w-4 h-4 text-[#8993A4]" />
                  <span>Studio Settings & Team</span>
                </Link>
                <Link
                  href="/calendar"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="w-full px-4 py-2.5 text-xs text-[#252B38] hover:bg-[#F8FAFC] hover:text-[#D9272E] flex items-center gap-2.5 transition-colors font-medium"
                >
                  <CalendarDays className="w-4 h-4 text-[#8993A4]" />
                  <span>Booking Calendar</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-[#E8EBF0]">
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

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
  User as UserIcon,
  ChevronDown,
  Settings,
  Sparkles,
} from "lucide-react";
import { NEPAL_TIMEZONE } from "@/lib/utils";

interface TopNavProps {
  onOpenMobileMenu?: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard Overview",
  "/calendar": "Booking Calendar",
  "/clients": "Client Directory",
  "/packages": "Photography Packages",
  "/finance": "Accounts & Finance",
  "/reports": "Business Reports & Analytics",
  "/settings": "Studio Settings",
};

export function TopNav({ onOpenMobileMenu }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { studioUser, signOut } = useAuth();
  const [nepalDate, setNepalDate] = useState<string>("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Format date in Asia/Kathmandu timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: NEPAL_TIMEZONE,
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    setNepalDate(formatter.format(new Date()));

    // Click outside handler for dropdown
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const title = PAGE_TITLES[pathname] || "Studio Manager";

  return (
    <header className="h-20 bg-white/90 backdrop-blur-md border-b border-[#EFE8DC] sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
      {/* Left: Mobile trigger & Page Title */}
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-lg text-charcoal-600 hover:bg-cream-100 border border-cream-200 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-semibold text-charcoal-900 tracking-tight">
            {title}
          </h1>
          <p className="text-xs text-charcoal-500 hidden sm:block">
            Newborn Photography Nepal • Studio Management System
          </p>
        </div>
      </div>

      {/* Right: Nepal Date & User Profile Dropdown Menu */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Nepal Date Badge */}
        <div className="hidden md:flex items-center gap-2 bg-[#FAF7F2] border border-[#EFE8DC] px-3.5 py-1.5 rounded-full text-xs font-medium text-charcoal-700 shadow-subtle">
          <CalendarDays className="w-3.5 h-3.5 text-studio-600" />
          <span>{nepalDate || "Kathmandu Studio"}</span>
          <span className="text-[10px] text-studio-600 font-mono font-bold uppercase bg-white px-1.5 py-0.5 rounded border border-[#E8DFD3]">
            NPT
          </span>
        </div>

        {/* User Profile Menu Dropdown */}
        <div className="relative border-l border-[#EFE8DC] pl-3 sm:pl-6" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-[#FAF7F2] transition-colors focus:outline-none focus:ring-2 focus:ring-studio-500/20"
            aria-expanded={isProfileMenuOpen}
            aria-haspopup="true"
          >
            <div className="w-9 h-9 rounded-full bg-studio-100 border border-studio-200 flex items-center justify-center text-studio-800 font-serif font-bold text-sm shadow-subtle">
              {studioUser?.displayName ? studioUser.displayName.charAt(0).toUpperCase() : "S"}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-charcoal-900 leading-tight">
                {studioUser?.displayName || "Studio Staff"}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-studio-600">
                  {studioUser?.role || "Staff"}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-charcoal-400 hidden sm:block" />
          </button>

          {/* Dropdown Menu Popup */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-[#EFE8DC] shadow-float py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-3 border-b border-[#F2ECE1]">
                <p className="text-xs font-bold text-charcoal-900 leading-tight">
                  {studioUser?.displayName || "Studio Staff"}
                </p>
                <p className="text-[11px] text-charcoal-400 truncate mt-0.5">
                  {studioUser?.email || "staff@newbornphotonepal.com"}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-studio-50 text-studio-700 border border-studio-200">
                    Role: {studioUser?.role || "Staff"}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </div>
              </div>

              <div className="py-1">
                <Link
                  href="/settings"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="w-full px-4 py-2 text-xs text-charcoal-700 hover:bg-[#FAF7F2] flex items-center gap-2.5 transition-colors"
                >
                  <Settings className="w-4 h-4 text-charcoal-400" />
                  <span>Studio Settings</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-[#F2ECE1]">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full px-4 py-2 text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 transition-colors font-medium text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

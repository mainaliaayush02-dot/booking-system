"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase-auth";
import {
  CalendarDays,
  LogOut,
  Menu,
  ShieldCheck,
  User as UserIcon,
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
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#EFE8DC] sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
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
            Newborn Photography Nepal Management Portal
          </p>
        </div>
      </div>

      {/* Right: Nepal Date, User Profile, Logout */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Nepal Date Badge */}
        <div className="hidden md:flex items-center gap-2 bg-[#F9F6F0] border border-[#EFE8DC] px-3.5 py-1.5 rounded-full text-xs font-medium text-charcoal-700">
          <CalendarDays className="w-3.5 h-3.5 text-studio-600" />
          <span>{nepalDate || "Kathmandu Studio"}</span>
          <span className="text-[10px] text-studio-500 font-mono uppercase bg-white px-1.5 py-0.5 rounded border border-[#E8DFD3]">
            NPT
          </span>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 border-l border-[#EFE8DC] pl-3 sm:pl-6">
          <div className="w-9 h-9 rounded-full bg-studio-100 border border-studio-200 flex items-center justify-center text-studio-800 font-serif font-semibold text-sm shadow-subtle">
            {studioUser?.displayName ? studioUser.displayName.charAt(0).toUpperCase() : "S"}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-charcoal-900 leading-tight">
              {studioUser?.displayName || "Studio Staff"}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-studio-600" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-studio-600">
                {studioUser?.role || "Staff"}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Log out of Studio Manager"
            className="ml-1 sm:ml-2 p-2 rounded-lg text-charcoal-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all flex items-center gap-1.5 text-xs font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden xl:inline">Log out</span>
          </button>
        </div>
      </div>
    </header>
  );
}

"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";
import { ProtectedRoute } from "./protected-route";

interface StudioLayoutProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "staff" | "photographer";
}

export function StudioLayout({ children, requiredRole }: StudioLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <div className="min-h-screen flex bg-[#FAF5F7] overflow-x-hidden text-[#332A34]">
        {/* Sidebar - fixed 250px on desktop */}
        <Sidebar
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        {/* Main Content Area - fills remaining available width */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <TopNav onOpenMobileMenu={() => setMobileOpen(true)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

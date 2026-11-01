import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/firebase-auth";

export const metadata: Metadata = {
  title: "Newborn Photography Nepal — Studio Manager",
  description: "Internal Photography Studio Management System for Newborn Photography Nepal",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-cream-50 text-charcoal-900 min-h-screen selection:bg-studio-100 selection:text-studio-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

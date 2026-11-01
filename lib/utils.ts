import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Nepal Timezone constant
export const NEPAL_TIMEZONE = "Asia/Kathmandu";

// Format currency in Nepalese Rupees (NPR)
export function formatNPR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "Rs. 0";
  }
  return `Rs. ${Number(amount).toLocaleString("en-IN")}`;
}

// Format date into Nepal readable format (e.g. 15 Nov 2026)
export function formatDate(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return "-";
  try {
    const d = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
    if (isNaN(d.getTime())) return String(dateStr);
    return format(d, "dd MMM yyyy");
  } catch {
    return String(dateStr);
  }
}

// Format full date with day of week (e.g. Sunday, 15 Nov 2026)
export function formatDateWithDay(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return "-";
  try {
    const d = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
    if (isNaN(d.getTime())) return String(dateStr);
    return format(d, "EEEE, dd MMMM yyyy");
  } catch {
    return String(dateStr);
  }
}

// Get current date string in Kathmandu timezone: YYYY-MM-DD
export function getTodayNepal(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: NEPAL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

// Convert 24h time "14:30" to 12h time "2:30 PM"
export function formatTime12h(time24: string | undefined): string {
  if (!time24) return "-";
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${m} ${ampm}`;
}

// Status styling badge helpers aligned with Deep Plum & Blush identity
export function getStatusBadgeStyle(status: string) {
  switch (status?.toLowerCase()) {
    case "confirmed":
      return "bg-[#FAF2F7] text-[#3D084B] border-[#D6A3C7]";
    case "completed":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "pending":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "cancelled":
      return "bg-rose-50 text-rose-800 border-rose-200";
    case "rescheduled":
      return "bg-[#F3E2EE] text-[#68456E] border-[#EBD8E1]";
    default:
      return "bg-[#EAD1DC]/40 text-[#68456E] border-[#EBD8E1]";
  }
}

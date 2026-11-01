// TypeScript definitions for Newborn Photography Nepal - Studio Manager

export type UserRole = 'admin' | 'staff' | 'photographer';

export interface StudioUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  active: boolean;
  createdAt: string;
}

export type BabyGender = 'boy' | 'girl' | 'twins' | 'expecting' | 'undisclosed';

export interface Client {
  id: string;
  fullName: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  babyName?: string;
  babyDob?: string; // ISO date or estimated due date
  babyGender?: BabyGender;
  notes?: string;
  totalBookings?: number;
  totalSpent?: number;
  createdAt: string;
  updatedAt: string;
}

export type PackageCategory = 'newborn' | 'maternity' | 'sitter_milestone' | 'family' | 'cake_smash' | 'other';

export interface PhotographyPackage {
  id: string;
  name: string;
  category: PackageCategory;
  price: number; // in NPR
  depositAmount: number; // minimum advance in NPR
  durationMinutes: number; // duration in minutes
  inclusions: string[]; // e.g. ["25 Edited Photos", "3 Setups", "Parent & Sibling Included", "Premium Photo Album"]
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';

export interface Booking {
  id: string;
  bookingNumber: string; // e.g. NPN-2026-001
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  babyName?: string;
  packageId: string;
  packageName: string;
  packagePriceSnapshot: number; // Snapshot of package price at time of booking
  discountAmount: number; // NPR
  discountReason?: string;
  totalAmount: number; // (packagePriceSnapshot - discountAmount)
  advancePaid: number; // Sum of paid advance payments
  remainingBalance: number; // (totalAmount - advancePaid)
  appointmentDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24-hour format)
  endTime: string; // HH:mm (24-hour format)
  status: BookingStatus;
  location?: 'studio' | 'home' | 'outdoor';
  photographerName?: string;
  notes?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'esewa' | 'khalti' | 'other';
export type PaymentType = 'advance' | 'remaining' | 'full' | 'additional';

export interface Payment {
  id: string;
  receiptNumber: string; // e.g. REC-2026-0001
  bookingId: string;
  bookingNumber: string;
  clientId: string;
  clientName: string;
  amount: number; // in NPR
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  paymentDate: string; // YYYY-MM-DD or ISO
  transactionReference?: string;
  notes?: string;
  recordedByUid: string;
  recordedByName: string;
  createdAt: string;
}

export type ExpenseCategory = 
  | 'studio_rent' 
  | 'equipment' 
  | 'props_costumes' 
  | 'utilities' 
  | 'marketing' 
  | 'salary' 
  | 'printing_framing' 
  | 'maintenance' 
  | 'refreshments'
  | 'other';

export interface StudioExpense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number; // in NPR
  expenseDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  vendor?: string;
  notes?: string;
  receiptUrl?: string;
  recordedByUid: string;
  recordedByName: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string; // e.g. "CREATED_BOOKING", "RECORDED_PAYMENT", "UPDATED_STATUS"
  entityType: 'booking' | 'client' | 'package' | 'payment' | 'expense' | 'auth';
  entityId: string;
  details: string;
  timestamp: string;
}

export interface DashboardMetrics {
  totalBookingsThisMonth: number;
  upcomingBookingsCount: number;
  monthlySalesRevenue: number; // Bookings sales total
  monthlyCashCollected: number; // Actual payments received
  monthlyExpenses: number; // Actual expenses paid
  cashProfit: number; // monthlyCashCollected - monthlyExpenses
  pendingBalanceTotal: number;
}


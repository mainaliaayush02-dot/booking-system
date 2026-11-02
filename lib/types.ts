// TypeScript definitions for Newborn Photography Nepal - Studio Manager (By Navin)

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

export interface ChildProfile {
  id?: string;
  name: string;
  dob?: string; // YYYY-MM-DD
  gender?: BabyGender;
  notes?: string;
}

export interface Client {
  id: string;
  fullName: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  babyName?: string;
  babyDob?: string; // YYYY-MM-DD
  babyGender?: BabyGender;
  children?: ChildProfile[];
  notes?: string;
  totalBookings?: number;
  totalSpent?: number;
  createdAt: string;
  updatedAt: string;
}

export type PackageCategory = 
  | 'Newborn Photography'
  | 'Maternity Photography'
  | 'Baby Photography'
  | 'Cake Smash Photography'
  | 'Family Photography'
  | 'Couple Photography'
  | 'Other'
  | string;

export interface PhotographyPackage {
  id: string;
  name: string;
  category: PackageCategory;
  price: number; // in NPR
  depositAmount: number; // minimum advance in NPR
  durationMinutes: number; // duration in minutes
  editedPhotosCount?: number;
  outfitChanges?: number;
  propsIncluded?: boolean;
  familyPortraitsIncluded?: boolean;
  inclusions: string[]; // e.g. ["25 Edited High-Res Photos", "3 Thematic Setups", "Parent & Sibling Included"]
  description?: string;
  internalNotes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid';

export interface PackageSnapshot {
  id?: string;
  name: string;
  category?: string;
  price: number;
  durationMinutes: number;
  inclusions: string[];
  editedPhotosCount?: number;
  outfitChanges?: number;
  propsIncluded?: boolean;
  familyPortraitsIncluded?: boolean;
}

export interface Booking {
  id: string;
  bookingNumber: string; // e.g. NPN-2026-0001
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  babyName?: string;
  babyDob?: string;
  category: PackageCategory;
  packageId?: string; // optional if custom booking
  packageName: string;
  packagePriceSnapshot: number; // Snapshot of package price at time of booking
  packageSnapshot?: PackageSnapshot;
  customAgreedPrice?: number;
  discountAmount: number; // NPR
  discountReason?: string;
  totalAmount: number; // (agreed price - discountAmount)
  advancePaid: number; // Sum of paid advance payments
  remainingBalance: number; // (totalAmount - advancePaid)
  paymentStatus?: PaymentStatus;
  appointmentDate: string; // YYYY-MM-DD (Asia/Kathmandu)
  startTime: string; // HH:mm (24-hour format)
  endTime: string; // HH:mm (24-hour format)
  durationMinutes: number;
  status: BookingStatus;
  location?: 'studio' | 'home' | 'outdoor';
  photographerName?: string;
  specialInstructions?: string;
  notes?: string;
  hasConflictOverride?: boolean;
  conflictOverrideReason?: string;
  rescheduledFromDate?: string;
  rescheduledFromTime?: string;
  rescheduleReason?: string;
  cancelledAt?: string;
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
  paymentDate: string; // YYYY-MM-DD
  transactionReference?: string;
  notes?: string;
  previousBalance?: number;
  remainingBalanceAfter?: number;
  isMigration?: boolean;
  isReversed?: boolean;
  reversalReason?: string;
  reversedAt?: string;
  reversedByUid?: string;
  reversedByName?: string;
  recordedByUid: string;
  recordedByName: string;
  createdAt: string;
}

export type ExpenseCategory = 
  | 'studio_rent' 
  | 'utilities'
  | 'equipment'
  | 'camera_accessories'
  | 'props_costumes'
  | 'baby_supplies'
  | 'salary'
  | 'marketing'
  | 'transportation'
  | 'maintenance'
  | 'software_subscriptions'
  | 'printing_framing'
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
  paidTo?: string;
  referenceNumber?: string;
  notes?: string;
  receiptUrl?: string;
  isReversed?: boolean;
  reversalReason?: string;
  reversedAt?: string;
  reversedByUid?: string;
  reversedByName?: string;
  updatedAt?: string;
  updatedByUid?: string;
  updatedByName?: string;
  recordedByUid: string;
  recordedByName: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string; // e.g. "CREATED_BOOKING", "EDITED_BOOKING", "RESCHEDULED_BOOKING", "CANCELLED_BOOKING"
  entityType: 'booking' | 'client' | 'package' | 'payment' | 'expense' | 'auth';
  entityId: string;
  details: string;
  timestamp: string;
}

export interface DashboardMetrics {
  totalBookingsThisMonth: number;
  upcomingBookingsCount: number;
  monthlySalesRevenue: number;
  monthlyCashCollected: number;
  monthlyExpenses: number;
  cashProfit: number;
  pendingBalanceTotal: number;
}

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  Client,
  PhotographyPackage,
  Booking,
  Payment,
  StudioExpense,
  ActivityLog,
  DashboardMetrics,
  PackageSnapshot,
} from "./types";
import { getTodayNepal } from "./utils";

// ----------------------------------------------------------------------
// ACTIVITY AUDIT LOGGING
// ----------------------------------------------------------------------
export async function logActivity(
  userId: string,
  userName: string,
  action: string,
  entityType: ActivityLog["entityType"],
  entityId: string,
  details: string
): Promise<void> {
  try {
    const col = collection(db, "activity_logs");
    await addDoc(col, {
      userId,
      userName,
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

// ----------------------------------------------------------------------
// CLIENT MANAGEMENT
// ----------------------------------------------------------------------
export async function getClients(): Promise<Client[]> {
  const q = query(collection(db, "clients"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Client, "id">) }));
}

export async function getRecentClients(maxItems = 5): Promise<Client[]> {
  const q = query(collection(db, "clients"), orderBy("createdAt", "desc"), limit(maxItems));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Client, "id">) }));
}

export async function getClientById(id: string): Promise<Client | null> {
  const ref = doc(db, "clients", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Client, "id">) };
}

export async function getClientBookings(clientId: string): Promise<Booking[]> {
  const q = query(
    collection(db, "bookings"),
    where("clientId", "==", clientId),
    orderBy("appointmentDate", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Booking, "id">) }));
}

export async function createClient(
  clientData: Omit<Client, "id" | "createdAt" | "updatedAt">,
  user: { uid: string; displayName: string }
): Promise<Client> {
  // Check for duplicate phone number to prevent duplicate client profiles
  const existingQ = query(collection(db, "clients"), where("phone", "==", clientData.phone.trim()));
  const existingSnap = await getDocs(existingQ);
  if (!existingSnap.empty) {
    const existing = existingSnap.docs[0];
    throw new Error(`A client with phone number ${clientData.phone} is already registered (${existing.data().fullName}).`);
  }

  const col = collection(db, "clients");
  const now = new Date().toISOString();
  const docRef = await addDoc(col, {
    ...clientData,
    phone: clientData.phone.trim(),
    totalBookings: 0,
    totalSpent: 0,
    createdAt: now,
    updatedAt: now,
  });

  await logActivity(
    user.uid,
    user.displayName,
    "CREATED_CLIENT",
    "client",
    docRef.id,
    `Registered client ${clientData.fullName} (Phone: ${clientData.phone})`
  );

  return { id: docRef.id, ...clientData, totalBookings: 0, totalSpent: 0, createdAt: now, updatedAt: now };
}

export async function updateClient(
  id: string,
  clientData: Partial<Client>,
  user: { uid: string; displayName: string }
): Promise<void> {
  const ref = doc(db, "clients", id);
  const now = new Date().toISOString();
  await updateDoc(ref, {
    ...clientData,
    updatedAt: now,
  });

  await logActivity(
    user.uid,
    user.displayName,
    "UPDATED_CLIENT",
    "client",
    id,
    `Updated client details for ${clientData.fullName || id}`
  );
}

// ----------------------------------------------------------------------
// PACKAGE MANAGEMENT
// ----------------------------------------------------------------------
export async function getPackages(includeInactive = true): Promise<PhotographyPackage[]> {
  let q;
  if (includeInactive) {
    q = query(collection(db, "packages"), orderBy("price", "asc"));
  } else {
    q = query(
      collection(db, "packages"),
      where("active", "==", true),
      orderBy("price", "asc")
    );
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PhotographyPackage, "id">) }));
}

export async function createPackage(
  pkgData: Omit<PhotographyPackage, "id" | "createdAt" | "updatedAt">,
  user: { uid: string; displayName: string }
): Promise<PhotographyPackage> {
  const col = collection(db, "packages");
  const now = new Date().toISOString();
  const docRef = await addDoc(col, {
    ...pkgData,
    createdAt: now,
    updatedAt: now,
  });

  await logActivity(
    user.uid,
    user.displayName,
    "CREATED_PACKAGE",
    "package",
    docRef.id,
    `Created photography package: ${pkgData.name} (NPR ${pkgData.price})`
  );

  return { id: docRef.id, ...pkgData, createdAt: now, updatedAt: now };
}

export async function updatePackage(
  id: string,
  pkgData: Partial<PhotographyPackage>,
  user: { uid: string; displayName: string }
): Promise<void> {
  const ref = doc(db, "packages", id);
  const now = new Date().toISOString();
  await updateDoc(ref, {
    ...pkgData,
    updatedAt: now,
  });

  await logActivity(
    user.uid,
    user.displayName,
    "UPDATED_PACKAGE",
    "package",
    id,
    `Updated package ${pkgData.name || id}`
  );
}

// Packages are never permanently deleted if used; they are marked inactive
export async function togglePackageActive(
  id: string,
  active: boolean,
  packageName: string,
  user: { uid: string; displayName: string }
): Promise<void> {
  const ref = doc(db, "packages", id);
  const now = new Date().toISOString();
  await updateDoc(ref, {
    active,
    updatedAt: now,
  });

  await logActivity(
    user.uid,
    user.displayName,
    active ? "ACTIVATED_PACKAGE" : "DEACTIVATED_PACKAGE",
    "package",
    id,
    `${active ? "Activated" : "Deactivated"} package ${packageName}`
  );
}

// Seed the 3 standard studio pricing tiers if database has 0 packages
export async function seedStandardPackages(user: { uid: string; displayName: string }): Promise<void> {
  const existing = await getPackages(true);
  if (existing.length > 0) return;

  const standardPackages: Omit<PhotographyPackage, "id" | "createdAt" | "updatedAt">[] = [
    {
      name: "Newborn Starter Collection",
      category: "Newborn Photography",
      price: 7999,
      depositAmount: 3000,
      durationMinutes: 90,
      editedPhotosCount: 15,
      outfitChanges: 2,
      propsIncluded: true,
      familyPortraitsIncluded: false,
      inclusions: [
        "15 Fully Retouched High-Resolution Photographs",
        "2 Styled Baby Setups & Props Included",
        "Baby Solo Focus Session",
        "Digital Download Gallery",
      ],
      description: "Essential newborn photography session focusing purely on delicate baby wraps and sleepy poses.",
      active: true,
    },
    {
      name: "Newborn Signature Collection",
      category: "Newborn Photography",
      price: 15999,
      depositAmount: 5000,
      durationMinutes: 150,
      editedPhotosCount: 30,
      outfitChanges: 3,
      propsIncluded: true,
      familyPortraitsIncluded: true,
      inclusions: [
        "30 Fully Retouched High-Resolution Photographs",
        "3 Styled Thematic Setups & Premium Outfits",
        "Parent & Sibling Portraits Included",
        "Private High-Speed Download Gallery",
        "Custom USB Drive with All Edited Files",
      ],
      description: "Our most popular studio experience including timeless parent-baby bonding portraits and artistic themes.",
      active: true,
    },
    {
      name: "Newborn Luxury Royal Suite",
      category: "Newborn Photography",
      price: 31999,
      depositAmount: 10000,
      durationMinutes: 240,
      editedPhotosCount: 50,
      outfitChanges: 5,
      propsIncluded: true,
      familyPortraitsIncluded: true,
      inclusions: [
        "50 Fully Retouched Masterpiece Portraits",
        "Unlimited Thematic Setups & Custom Backdrops",
        "Grandparents & Extended Family Included",
        "Premium Flush-Mount Layflat Photo Album (10x10)",
        "Framed Large Canvas Portrait (16x24)",
        "Priority 7-Day Express Delivery",
      ],
      description: "The complete luxury heirloom package featuring heirloom albums, wall art, and unhurried studio comfort.",
      active: true,
    },
  ];

  for (const pkg of standardPackages) {
    await createPackage(pkg, user);
  }
}

// ----------------------------------------------------------------------
// BOOKING MANAGEMENT & CONFLICT DETECTION
// ----------------------------------------------------------------------
export async function getBookings(): Promise<Booking[]> {
  const q = query(collection(db, "bookings"), orderBy("appointmentDate", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Booking, "id">) }));
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const ref = doc(db, "bookings", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Booking, "id">) };
}

export async function getBookingsByDateRange(startDate: string, endDate: string): Promise<Booking[]> {
  const q = query(
    collection(db, "bookings"),
    where("appointmentDate", ">=", startDate),
    where("appointmentDate", "<=", endDate),
    orderBy("appointmentDate", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Booking, "id">) }));
}

export async function getTodaySessions(): Promise<Booking[]> {
  const todayStr = getTodayNepal();
  const q = query(
    collection(db, "bookings"),
    where("appointmentDate", "==", todayStr),
    where("status", "!=", "cancelled")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Booking, "id">) }))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export async function getUpcomingBookings(maxItems = 8): Promise<Booking[]> {
  const todayStr = getTodayNepal();
  const q = query(
    collection(db, "bookings"),
    where("appointmentDate", ">=", todayStr),
    where("status", "!=", "cancelled"),
    orderBy("appointmentDate", "asc"),
    limit(maxItems)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Booking, "id">) }));
}

// Conflict Detection: Overlap condition: (StartA < EndB) && (EndA > StartB)
export async function detectBookingConflicts(
  appointmentDate: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string
): Promise<Booking[]> {
  const q = query(
    collection(db, "bookings"),
    where("appointmentDate", "==", appointmentDate),
    where("status", "!=", "cancelled")
  );
  const snapshot = await getDocs(q);
  const existing = snapshot.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Booking, "id">) }))
    .filter((b) => b.id !== excludeBookingId);

  return existing.filter((b) => startTime < b.endTime && endTime > b.startTime);
}

// Format: NPN-YYYY-0001 (Sequential non-reusing booking identifier)
export async function generateBookingNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"), limit(1));
  const snap = await getDocs(q);
  let nextSeq = 1;
  if (!snap.empty) {
    const last = snap.docs[0].data() as Booking;
    if (last.bookingNumber && last.bookingNumber.startsWith(`NPN-${year}`)) {
      const parts = last.bookingNumber.split("-");
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num)) {
        nextSeq = num + 1;
      }
    }
  }
  return `NPN-${year}-${String(nextSeq).padStart(4, "0")}`;
}

export async function createBooking(
  data: {
    clientId: string;
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    babyName?: string;
    babyDob?: string;
    category: string;
    packageId?: string;
    packageName: string;
    packagePriceSnapshot: number;
    packageSnapshot?: PackageSnapshot;
    customAgreedPrice?: number;
    discountAmount: number;
    discountReason?: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    status: Booking["status"];
    location?: 'studio' | 'home' | 'outdoor';
    photographerName?: string;
    specialInstructions?: string;
    notes?: string;
    hasConflictOverride?: boolean;
    conflictOverrideReason?: string;
  },
  user: { uid: string; displayName: string }
): Promise<Booking> {
  // Validate conflict unless explicitly overridden by authorized admin
  const conflicts = await detectBookingConflicts(data.appointmentDate, data.startTime, data.endTime);
  if (conflicts.length > 0 && !data.hasConflictOverride) {
    throw new Error(
      `Appointment slot conflict: Overlaps with existing session for ${conflicts[0].clientName} (${conflicts[0].startTime} - ${conflicts[0].endTime}).`
    );
  }

  const bookingNumber = await generateBookingNumber();
  const agreedPrice = data.customAgreedPrice !== undefined ? data.customAgreedPrice : data.packagePriceSnapshot;
  const totalAmount = Math.max(0, agreedPrice - (data.discountAmount || 0));
  const now = new Date().toISOString();

  const newBooking: Omit<Booking, "id"> = {
    bookingNumber,
    clientId: data.clientId,
    clientName: data.clientName,
    clientPhone: data.clientPhone,
    clientEmail: data.clientEmail || "",
    babyName: data.babyName || "",
    babyDob: data.babyDob || "",
    category: data.category,
    packageId: data.packageId || "",
    packageName: data.packageName,
    packagePriceSnapshot: data.packagePriceSnapshot,
    packageSnapshot: data.packageSnapshot || {
      name: data.packageName,
      price: data.packagePriceSnapshot,
      durationMinutes: data.durationMinutes,
      inclusions: [],
    },
    customAgreedPrice: data.customAgreedPrice,
    discountAmount: data.discountAmount || 0,
    discountReason: data.discountReason || "",
    totalAmount,
    advancePaid: 0,
    remainingBalance: totalAmount,
    appointmentDate: data.appointmentDate,
    startTime: data.startTime,
    endTime: data.endTime,
    durationMinutes: data.durationMinutes,
    status: data.status || "pending",
    location: data.location || "studio",
    photographerName: data.photographerName || "",
    specialInstructions: data.specialInstructions || "",
    notes: data.notes || "",
    hasConflictOverride: Boolean(data.hasConflictOverride),
    conflictOverrideReason: data.conflictOverrideReason || "",
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, "bookings"), newBooking);

  // Update client total bookings
  try {
    const clientRef = doc(db, "clients", data.clientId);
    const clientSnap = await getDoc(clientRef);
    if (clientSnap.exists()) {
      const cData = clientSnap.data();
      await updateDoc(clientRef, {
        totalBookings: (cData.totalBookings || 0) + 1,
        totalSpent: (cData.totalSpent || 0) + totalAmount,
        updatedAt: now,
      });
    }
  } catch (err) {
    console.error("Error updating client stats:", err);
  }

  await logActivity(
    user.uid,
    user.displayName,
    "CREATED_BOOKING",
    "booking",
    docRef.id,
    `Created booking ${bookingNumber} for ${data.clientName} on ${data.appointmentDate} (${data.startTime}-${data.endTime})`
  );

  return { id: docRef.id, ...newBooking };
}

export async function updateBooking(
  id: string,
  data: Partial<Booking>,
  user: { uid: string; displayName: string }
): Promise<void> {
  const ref = doc(db, "bookings", id);
  const now = new Date().toISOString();
  await updateDoc(ref, {
    ...data,
    updatedAt: now,
  });

  await logActivity(
    user.uid,
    user.displayName,
    "EDITED_BOOKING",
    "booking",
    id,
    `Edited booking details (${data.status ? `Status: ${data.status}` : ""})`
  );
}

export async function rescheduleBooking(
  id: string,
  newDate: string,
  newStartTime: string,
  newEndTime: string,
  reason: string,
  hasConflictOverride: boolean,
  user: { uid: string; displayName: string }
): Promise<void> {
  const conflicts = await detectBookingConflicts(newDate, newStartTime, newEndTime, id);
  if (conflicts.length > 0 && !hasConflictOverride) {
    throw new Error(
      `Reschedule slot conflict: Overlaps with ${conflicts[0].clientName} (${conflicts[0].startTime} - ${conflicts[0].endTime}).`
    );
  }

  const ref = doc(db, "bookings", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Booking not found");
  const current = snap.data() as Booking;

  const now = new Date().toISOString();
  await updateDoc(ref, {
    rescheduledFromDate: current.appointmentDate,
    rescheduledFromTime: current.startTime,
    rescheduleReason: reason,
    appointmentDate: newDate,
    startTime: newStartTime,
    endTime: newEndTime,
    status: "rescheduled",
    hasConflictOverride,
    updatedAt: now,
  });

  await logActivity(
    user.uid,
    user.displayName,
    "RESCHEDULED_BOOKING",
    "booking",
    id,
    `Rescheduled booking ${current.bookingNumber} from ${current.appointmentDate} to ${newDate} (${newStartTime}-${newEndTime}). Reason: ${reason}`
  );
}

export async function cancelBooking(
  id: string,
  reason: string,
  user: { uid: string; displayName: string }
): Promise<void> {
  const ref = doc(db, "bookings", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Booking not found");
  const current = snap.data() as Booking;

  const now = new Date().toISOString();
  await updateDoc(ref, {
    status: "cancelled",
    cancelledAt: now,
    cancellationReason: reason,
    updatedAt: now,
  });

  await logActivity(
    user.uid,
    user.displayName,
    "CANCELLED_BOOKING",
    "booking",
    id,
    `Cancelled booking ${current.bookingNumber} for ${current.clientName}. Reason: ${reason}`
  );
}

// ----------------------------------------------------------------------
// PAYMENTS & EXPENSES (Reconciliation & preparation for Phase 3)
// ----------------------------------------------------------------------
export async function getPayments(bookingId?: string): Promise<Payment[]> {
  let q;
  if (bookingId) {
    q = query(
      collection(db, "payments"),
      where("bookingId", "==", bookingId),
      orderBy("paymentDate", "desc")
    );
  } else {
    q = query(collection(db, "payments"), orderBy("paymentDate", "desc"));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Payment, "id">) }));
}

export async function getRecentPayments(maxItems = 5): Promise<Payment[]> {
  const q = query(collection(db, "payments"), orderBy("createdAt", "desc"), limit(maxItems));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Payment, "id">) }));
}

export async function getExpenses(): Promise<StudioExpense[]> {
  const q = query(collection(db, "expenses"), orderBy("expenseDate", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<StudioExpense, "id">) }));
}

// ----------------------------------------------------------------------
// DASHBOARD METRICS & REVENUE TREND
// ----------------------------------------------------------------------
export interface MonthlyTrendData {
  month: string;
  salesBooked: number;
  cashReceived: number;
  expenses: number;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics & { totalAllTimeBookings: number }> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const monthPrefix = `${currentYear}-${currentMonth}`;

  const [bookingsSnap, paymentsSnap, expensesSnap] = await Promise.all([
    getDocs(collection(db, "bookings")),
    getDocs(collection(db, "payments")),
    getDocs(collection(db, "expenses")),
  ]);

  const allBookings = bookingsSnap.docs.map((d) => d.data() as Booking);
  const allPayments = paymentsSnap.docs.map((d) => d.data() as Payment);
  const allExpenses = expensesSnap.docs.map((d) => d.data() as StudioExpense);

  const thisMonthBookings = allBookings.filter(
    (b) => b.appointmentDate?.startsWith(monthPrefix) && b.status !== "cancelled"
  );

  const monthlySalesRevenue = thisMonthBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const monthlyPayments = allPayments.filter((p) => p.paymentDate?.startsWith(monthPrefix));
  const monthlyCashCollected = monthlyPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const monthlyExpensesList = allExpenses.filter((e) => e.expenseDate?.startsWith(monthPrefix));
  const monthlyExpenses = monthlyExpensesList.reduce((sum, e) => sum + (e.amount || 0), 0);

  const cashProfit = monthlyCashCollected - monthlyExpenses;

  const todayStr = getTodayNepal();
  const upcomingBookingsCount = allBookings.filter(
    (b) => b.appointmentDate >= todayStr && (b.status === "confirmed" || b.status === "pending")
  ).length;

  const pendingBalanceTotal = allBookings
    .filter((b) => b.status !== "cancelled" && b.status !== "completed")
    .reduce((sum, b) => sum + (b.remainingBalance || 0), 0);

  return {
    totalBookingsThisMonth: thisMonthBookings.length,
    totalAllTimeBookings: allBookings.filter((b) => b.status !== "cancelled").length,
    upcomingBookingsCount,
    monthlySalesRevenue,
    monthlyCashCollected,
    monthlyExpenses,
    cashProfit,
    pendingBalanceTotal,
  };
}

export async function getMonthlyRevenueTrend(): Promise<MonthlyTrendData[]> {
  const now = new Date();
  const months: { label: string; key: string }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "short" });
    months.push({ label, key });
  }

  const [bookingsSnap, paymentsSnap, expensesSnap] = await Promise.all([
    getDocs(collection(db, "bookings")),
    getDocs(collection(db, "payments")),
    getDocs(collection(db, "expenses")),
  ]);

  const allBookings = bookingsSnap.docs.map((d) => d.data() as Booking);
  const allPayments = paymentsSnap.docs.map((d) => d.data() as Payment);
  const allExpenses = expensesSnap.docs.map((d) => d.data() as StudioExpense);

  return months.map(({ label, key }) => {
    const salesBooked = allBookings
      .filter((b) => b.appointmentDate?.startsWith(key) && b.status !== "cancelled")
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const cashReceived = allPayments
      .filter((p) => p.paymentDate?.startsWith(key))
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const expenses = allExpenses
      .filter((e) => e.expenseDate?.startsWith(key))
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    return {
      month: label,
      salesBooked,
      cashReceived,
      expenses,
    };
  });
}

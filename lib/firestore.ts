import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
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
  BookingStatus,
  Payment,
  StudioExpense,
  ActivityLog,
  DashboardMetrics,
  PackageSnapshot,
  PaymentMethod,
  PaymentType,
  ExpenseCategory,
  StudioUser,
  Lead,
  FollowUp,
} from "./types";
import { getTodayNepal } from "./utils";
import {
  calculatePaymentStatus,
  validatePaymentAmount,
  calculateFinancialSummary,
} from "./finance-calculations";

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

export async function getActivityLogs(maxItems = 100): Promise<ActivityLog[]> {
  try {
    const q = query(collection(db, "activity_logs"), orderBy("timestamp", "desc"), limit(maxItems));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ActivityLog, "id">) }));
  } catch (err) {
    console.warn("Could not query activity logs with orderBy, falling back to base collection:", err);
    const snap = await getDocs(collection(db, "activity_logs"));
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ActivityLog, "id">) }));
    list.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
    return list.slice(0, maxItems);
  }
}

// ----------------------------------------------------------------------
// STUDIO TEAM & USERS
// ----------------------------------------------------------------------
export async function getStudioUsers(): Promise<StudioUser[]> {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<StudioUser, "uid">) }));
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
  return snapshot.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<PhotographyPackage, "id">) }))
    .filter((pkg) => pkg.isDeleted !== true);
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

/**
 * Inspect whether a package is referenced by any bookings in Firestore
 */
export async function checkPackageUsage(
  packageId: string,
  packageName?: string
): Promise<{
  isReferenced: boolean;
  bookingCount: number;
  sampleBookingNumbers: string[];
}> {
  const bookingsRef = collection(db, "bookings");
  const bookingsMap = new Map<string, string>(); // bookingId -> bookingNumber

  try {
    const idQuery = query(bookingsRef, where("packageId", "==", packageId));
    const idSnap = await getDocs(idQuery);
    idSnap.docs.forEach((docSnap) => {
      const data = docSnap.data() as Booking;
      bookingsMap.set(docSnap.id, data.bookingNumber || docSnap.id);
    });
  } catch (err) {
    console.warn("Could not query bookings by packageId:", err);
  }

  if (packageName) {
    try {
      const nameQuery = query(bookingsRef, where("packageName", "==", packageName));
      const nameSnap = await getDocs(nameQuery);
      nameSnap.docs.forEach((docSnap) => {
        const data = docSnap.data() as Booking;
        bookingsMap.set(docSnap.id, data.bookingNumber || docSnap.id);
      });
    } catch (err) {
      console.warn("Could not query bookings by packageName:", err);
    }
  }

  return {
    isReferenced: bookingsMap.size > 0,
    bookingCount: bookingsMap.size,
    sampleBookingNumbers: Array.from(bookingsMap.values()).slice(0, 3),
  };
}

/**
 * Delete a photography package with safety checks and RBAC:
 * - Admin authorization strictly required.
 * - If package is referenced by historical bookings, safe soft-delete/archive preserves data integrity.
 * - If package is unreferenced, safely removed.
 * - Deletion logged in activity_logs audit trail.
 */
export async function deletePackage(
  packageId: string,
  user: { uid: string; displayName: string; role?: string }
): Promise<{
  success: boolean;
  softDeleted: boolean;
  packageName: string;
  bookingCount: number;
}> {
  if (user.role !== "admin") {
    throw new Error("Unauthorized: Only studio administrators can delete photography packages.");
  }

  const pkgRef = doc(db, "packages", packageId);
  const pkgSnap = await getDoc(pkgRef);
  if (!pkgSnap.exists()) {
    throw new Error("Photography package not found.");
  }

  const pkgData = pkgSnap.data() as PhotographyPackage;
  const packageName = pkgData.name || "Photography Package";

  // Check if historical bookings reference this package
  const usage = await checkPackageUsage(packageId, packageName);
  const now = new Date().toISOString();

  if (usage.isReferenced) {
    // Soft-delete / Archive safely: Preserves booking history, receipts & financial audit records
    await updateDoc(pkgRef, {
      isDeleted: true,
      active: false,
      deletedAt: now,
      deletedByUid: user.uid,
      deletedByName: user.displayName,
      updatedAt: now,
    });

    await logActivity(
      user.uid,
      user.displayName,
      "DELETED_PACKAGE",
      "package",
      packageId,
      `Safely archived package "${packageName}" (${usage.bookingCount} historical booking${usage.bookingCount === 1 ? "" : "s"} preserved)`
    );

    return {
      success: true,
      softDeleted: true,
      packageName,
      bookingCount: usage.bookingCount,
    };
  } else {
    // Permanently remove unreferenced package document
    await deleteDoc(pkgRef);

    await logActivity(
      user.uid,
      user.displayName,
      "DELETED_PACKAGE",
      "package",
      packageId,
      `Permanently deleted unreferenced package "${packageName}"`
    );

    return {
      success: true,
      softDeleted: false,
      packageName,
      bookingCount: 0,
    };
  }
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
    paymentStatus: "unpaid",
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
// CONCURRENCY-SAFE RECEIPT SEQUENCE GENERATOR & PAYMENT LEDGER
// ----------------------------------------------------------------------

export interface RecordPaymentInput {
  bookingId?: string;
  bookingNumber?: string;
  clientId?: string;
  clientName: string;
  amount: number;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  paymentDate: string; // YYYY-MM-DD
  transactionReference?: string;
  notes?: string;
}

export async function recordPaymentWithReceipt(
  paymentData: RecordPaymentInput,
  user: { uid: string; displayName: string }
): Promise<Payment> {
  const targetYear = paymentData.paymentDate
    ? parseInt(paymentData.paymentDate.split("-")[0], 10) || new Date().getFullYear()
    : new Date().getFullYear();

  const counterRef = doc(db, "counters", `receipts_${targetYear}`);
  const hasLinkedBooking = Boolean(
    paymentData.bookingId &&
    paymentData.bookingId !== "general" &&
    paymentData.bookingId !== "manual"
  );
  const bookingRef = hasLinkedBooking ? doc(db, "bookings", paymentData.bookingId!) : null;

  const result = await runTransaction(db, async (transaction) => {
    let bData: Booking | null = null;
    let previousBalance = 0;
    let newAdvance = 0;
    let remainingBalanceAfter = 0;
    let newPaymentStatus: Booking["paymentStatus"] = undefined;

    if (bookingRef) {
      const bSnap = await transaction.get(bookingRef);
      if (!bSnap.exists()) {
        throw new Error("Linked booking not found.");
      }
      bData = bSnap.data() as Booking;

      const totalAmount = Number(bData.totalAmount) || 0;
      const currentAdvance = Number(bData.advancePaid) || 0;
      previousBalance = Math.max(0, totalAmount - currentAdvance);

      const validation = validatePaymentAmount(totalAmount, currentAdvance, paymentData.amount);
      if (!validation.valid) {
        throw new Error(validation.error || "Payment exceeds remaining booking balance.");
      }

      newAdvance = currentAdvance + paymentData.amount;
      remainingBalanceAfter = Math.max(0, totalAmount - newAdvance);
      newPaymentStatus = calculatePaymentStatus(totalAmount, newAdvance);
    }

    // Sequence counter increment
    const counterSnap = await transaction.get(counterRef);
    let nextSeq = 1;
    if (counterSnap.exists()) {
      const cData = counterSnap.data();
      nextSeq = (Number(cData.lastSeq) || 0) + 1;
    }
    transaction.set(
      counterRef,
      {
        lastSeq: nextSeq,
        year: targetYear,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    const receiptNumber = `REC-${targetYear}-${String(nextSeq).padStart(4, "0")}`;
    const nowIso = new Date().toISOString();

    const paymentCol = collection(db, "payments");
    const newPaymentRef = doc(paymentCol);

    const payload: Omit<Payment, "id"> = {
      receiptNumber,
      bookingId: paymentData.bookingId || "general",
      bookingNumber: paymentData.bookingNumber || (bData ? bData.bookingNumber : "MANUAL"),
      clientId: paymentData.clientId || (bData ? bData.clientId : "general"),
      clientName: paymentData.clientName.trim(),
      amount: paymentData.amount,
      paymentType: paymentData.paymentType,
      paymentMethod: paymentData.paymentMethod,
      paymentDate: paymentData.paymentDate,
      transactionReference: paymentData.transactionReference || "",
      notes: paymentData.notes || "",
      previousBalance: hasLinkedBooking ? previousBalance : 0,
      remainingBalanceAfter: hasLinkedBooking ? remainingBalanceAfter : 0,
      isMigration: false,
      isReversed: false,
      recordedByUid: user.uid,
      recordedByName: user.displayName,
      createdAt: nowIso,
    };

    transaction.set(newPaymentRef, {
      ...payload,
      timestamp: serverTimestamp(),
    });

    if (bookingRef && bData) {
      transaction.update(bookingRef, {
        advancePaid: newAdvance,
        remainingBalance: remainingBalanceAfter,
        paymentStatus: newPaymentStatus,
        updatedAt: nowIso,
      });
    }

    return { id: newPaymentRef.id, ...payload };
  });

  await logActivity(
    user.uid,
    user.displayName,
    "RECORD_PAYMENT",
    "payment",
    result.id,
    `Recorded payment receipt ${result.receiptNumber} of NPR ${paymentData.amount} (${paymentData.paymentMethod}) for client ${paymentData.clientName}`
  );

  return result;
}

export async function createPayment(
  paymentData: Omit<Payment, "id" | "receiptNumber" | "createdAt">,
  user: { uid: string; displayName: string }
): Promise<Payment> {
  return recordPaymentWithReceipt(paymentData, user);
}

export async function reversePaymentWithAudit(
  paymentId: string,
  reason: string,
  user: { uid: string; displayName: string }
): Promise<void> {
  const paymentRef = doc(db, "payments", paymentId);
  const nowIso = new Date().toISOString();

  await runTransaction(db, async (transaction) => {
    const paymentSnap = await transaction.get(paymentRef);
    if (!paymentSnap.exists()) {
      throw new Error("Payment record not found.");
    }
    const payment = paymentSnap.data() as Payment;
    if (payment.isReversed) {
      throw new Error("This payment has already been reversed.");
    }

    const hasLinkedBooking = Boolean(
      payment.bookingId &&
      payment.bookingId !== "general" &&
      payment.bookingId !== "manual"
    );

    if (hasLinkedBooking) {
      const bookingRef = doc(db, "bookings", payment.bookingId);
      const bookingSnap = await transaction.get(bookingRef);
      if (bookingSnap.exists()) {
        const bData = bookingSnap.data() as Booking;
        const totalAmount = Number(bData.totalAmount) || 0;
        const currentAdvance = Number(bData.advancePaid) || 0;
        const newAdvance = Math.max(0, currentAdvance - payment.amount);
        const newRemaining = Math.max(0, totalAmount - newAdvance);
        const newStatus = calculatePaymentStatus(totalAmount, newAdvance);

        transaction.update(bookingRef, {
          advancePaid: newAdvance,
          remainingBalance: newRemaining,
          paymentStatus: newStatus,
          updatedAt: nowIso,
        });
      }
    }

    transaction.update(paymentRef, {
      isReversed: true,
      reversalReason: reason.trim(),
      reversedAt: nowIso,
      reversedByUid: user.uid,
      reversedByName: user.displayName,
    });
  });

  await logActivity(
    user.uid,
    user.displayName,
    "REVERSED_PAYMENT",
    "payment",
    paymentId,
    `Reversed payment receipt #${paymentId}. Reason: ${reason}`
  );
}

// ----------------------------------------------------------------------
// EXPENSE MANAGEMENT WORKFLOW WITH AUDIT & REVERSALS
// ----------------------------------------------------------------------

export async function createExpenseWithAudit(
  expenseData: Omit<StudioExpense, "id" | "createdAt">,
  user: { uid: string; displayName: string }
): Promise<StudioExpense> {
  const nowIso = new Date().toISOString();
  const payload: Omit<StudioExpense, "id"> = {
    ...expenseData,
    isReversed: false,
    recordedByUid: user.uid,
    recordedByName: user.displayName,
    createdAt: nowIso,
  };

  const docRef = await addDoc(collection(db, "expenses"), {
    ...payload,
    timestamp: serverTimestamp(),
  });

  await logActivity(
    user.uid,
    user.displayName,
    "LOG_EXPENSE",
    "expense",
    docRef.id,
    `Logged studio expense of NPR ${expenseData.amount} for "${expenseData.title}" (${expenseData.category})`
  );

  return { id: docRef.id, ...payload };
}

export async function createExpense(
  expenseData: Omit<StudioExpense, "id" | "createdAt">,
  user: { uid: string; displayName: string }
): Promise<StudioExpense> {
  return createExpenseWithAudit(expenseData, user);
}

export async function updateExpenseWithAudit(
  expenseId: string,
  data: Partial<StudioExpense>,
  user: { uid: string; displayName: string }
): Promise<void> {
  const expenseRef = doc(db, "expenses", expenseId);
  const nowIso = new Date().toISOString();

  await updateDoc(expenseRef, {
    ...data,
    updatedAt: nowIso,
    updatedByUid: user.uid,
    updatedByName: user.displayName,
  });

  await logActivity(
    user.uid,
    user.displayName,
    "EDITED_EXPENSE",
    "expense",
    expenseId,
    `Updated studio expense details: ${data.title || expenseId}`
  );
}

export async function reverseExpenseWithAudit(
  expenseId: string,
  reason: string,
  user: { uid: string; displayName: string }
): Promise<void> {
  const expenseRef = doc(db, "expenses", expenseId);
  const nowIso = new Date().toISOString();

  const snap = await getDoc(expenseRef);
  if (!snap.exists()) {
    throw new Error("Expense record not found.");
  }
  const current = snap.data() as StudioExpense;
  if (current.isReversed) {
    throw new Error("This expense has already been reversed.");
  }

  await updateDoc(expenseRef, {
    isReversed: true,
    reversalReason: reason.trim(),
    reversedAt: nowIso,
    reversedByUid: user.uid,
    reversedByName: user.displayName,
    updatedAt: nowIso,
  });

  await logActivity(
    user.uid,
    user.displayName,
    "REVERSED_EXPENSE",
    "expense",
    expenseId,
    `Reversed studio expense record #${expenseId}. Reason: ${reason}`
  );
}

// ----------------------------------------------------------------------
// HISTORICAL ADVANCES MIGRATION (Idempotent)
// ----------------------------------------------------------------------

export interface MigrationReport {
  scannedBookings: number;
  migratedPayments: number;
  alreadySynchronized: number;
  skippedBookings: number;
  failedCount: number;
  details: string[];
}

export async function migrateHistoricalAdvances(
  user: { uid: string; displayName: string }
): Promise<MigrationReport> {
  const [bookingsSnap, paymentsSnap] = await Promise.all([
    getDocs(collection(db, "bookings")),
    getDocs(collection(db, "payments")),
  ]);

  const allBookings = bookingsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Booking, "id">) })) as Booking[];
  const allPayments = paymentsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Payment, "id">) })) as Payment[];

  // Group existing non-reversed payments by bookingId
  const paymentsByBooking: Record<string, number> = {};
  for (const p of allPayments) {
    if (p.isReversed) continue;
    if (p.bookingId) {
      paymentsByBooking[p.bookingId] = (paymentsByBooking[p.bookingId] || 0) + (Number(p.amount) || 0);
    }
  }

  let scanned = 0;
  let migrated = 0;
  let alreadySync = 0;
  let skipped = 0;
  let failed = 0;
  const details: string[] = [];

  for (const booking of allBookings) {
    scanned++;

    if (booking.status === "cancelled") {
      skipped++;
      continue;
    }

    const advancePaid = Number(booking.advancePaid) || 0;
    if (advancePaid <= 0) {
      skipped++;
      continue;
    }

    try {
      const recordedPayments = paymentsByBooking[booking.id] || 0;
      const diff = advancePaid - recordedPayments;

      if (diff <= 0) {
        alreadySync++;
        if (!booking.paymentStatus) {
          const correctStatus = calculatePaymentStatus(booking.totalAmount, advancePaid);
          await updateDoc(doc(db, "bookings", booking.id), { paymentStatus: correctStatus });
        }
        continue;
      }

      const paymentYear = booking.createdAt
        ? parseInt(booking.createdAt.slice(0, 4), 10) || new Date().getFullYear()
        : new Date().getFullYear();
      const counterRef = doc(db, "counters", `receipts_${paymentYear}`);

      const receiptNumber = await runTransaction(db, async (tx) => {
        const cSnap = await tx.get(counterRef);
        let seq = 1;
        if (cSnap.exists()) {
          seq = (Number(cSnap.data().lastSeq) || 0) + 1;
        }
        tx.set(counterRef, { lastSeq: seq, year: paymentYear, updatedAt: serverTimestamp() }, { merge: true });
        return `REC-${paymentYear}-${String(seq).padStart(4, "0")}`;
      });

      const nowIso = new Date().toISOString();
      const paymentDate = booking.createdAt
        ? booking.createdAt.slice(0, 10)
        : booking.appointmentDate || getTodayNepal();

      const paymentCol = collection(db, "payments");
      const newPaymentRef = doc(paymentCol);

      const newPayment: Omit<Payment, "id"> = {
        receiptNumber,
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber || "NPN-LEGACY",
        clientId: booking.clientId || "general",
        clientName: booking.clientName || "Client",
        amount: diff,
        paymentType: "advance",
        paymentMethod: "cash",
        paymentDate,
        notes: "Historical advance migration",
        previousBalance: booking.totalAmount - recordedPayments,
        remainingBalanceAfter: booking.remainingBalance,
        isMigration: true,
        isReversed: false,
        recordedByUid: user.uid,
        recordedByName: user.displayName,
        createdAt: nowIso,
      };

      await setDoc(newPaymentRef, {
        ...newPayment,
        timestamp: serverTimestamp(),
      });

      const correctStatus = calculatePaymentStatus(booking.totalAmount, advancePaid);
      await updateDoc(doc(db, "bookings", booking.id), {
        paymentStatus: correctStatus,
        updatedAt: nowIso,
      });

      await logActivity(
        user.uid,
        user.displayName,
        "MIGRATE_ADVANCE",
        "payment",
        newPaymentRef.id,
        `Migrated historical advance of NPR ${diff} for booking ${booking.bookingNumber} (${receiptNumber})`
      );

      migrated++;
      details.push(`Migrated ${receiptNumber}: NPR ${diff} for ${booking.bookingNumber} (${booking.clientName})`);
    } catch (err: any) {
      failed++;
      details.push(`Failed for booking ${booking.bookingNumber}: ${err?.message || "Unknown error"}`);
    }
  }

  return {
    scannedBookings: scanned,
    migratedPayments: migrated,
    alreadySynchronized: alreadySync,
    skippedBookings: skipped,
    failedCount: failed,
    details,
  };
}

// ----------------------------------------------------------------------
// CANONICAL DASHBOARD METRICS & REVENUE TREND
// ----------------------------------------------------------------------

export interface MonthlyTrendData {
  month: string;
  salesBooked: number;
  cashReceived: number;
  expenses: number;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics & { totalAllTimeBookings: number }> {
  const todayStr = getTodayNepal();
  const monthPrefix = todayStr.slice(0, 7); // Strictly Asia/Kathmandu YYYY-MM

  const [bookingsSnap, paymentsSnap, expensesSnap] = await Promise.all([
    getDocs(collection(db, "bookings")),
    getDocs(collection(db, "payments")),
    getDocs(collection(db, "expenses")),
  ]);

  const allBookings = bookingsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Booking, "id">) })) as Booking[];
  const allPayments = paymentsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Payment, "id">) })) as Payment[];
  const allExpenses = expensesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<StudioExpense, "id">) })) as StudioExpense[];

  const thisMonthBookings = allBookings.filter(
    (b) => b.appointmentDate?.startsWith(monthPrefix) && b.status !== "cancelled"
  );
  const monthlySalesRevenue = thisMonthBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  const monthlyPayments = allPayments.filter(
    (p) => !p.isReversed && p.paymentDate?.startsWith(monthPrefix)
  );
  const monthlyCashCollected = monthlyPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const monthlyExpensesList = allExpenses.filter(
    (e) => !e.isReversed && e.expenseDate?.startsWith(monthPrefix)
  );
  const monthlyExpenses = monthlyExpensesList.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const cashProfit = monthlyCashCollected - monthlyExpenses;

  const upcomingBookingsCount = allBookings.filter(
    (b) => b.appointmentDate >= todayStr && (b.status === "confirmed" || b.status === "pending")
  ).length;

  const pendingBalanceTotal = allBookings
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + (Number(b.remainingBalance) || 0), 0);

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
      .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

    const cashReceived = allPayments
      .filter((p) => !p.isReversed && p.paymentDate?.startsWith(key))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const expenses = allExpenses
      .filter((e) => !e.isReversed && e.expenseDate?.startsWith(key))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    return {
      month: label,
      salesBooked,
      cashReceived,
      expenses,
    };
  });
}

// ----------------------------------------------------------------------
// SESSIONS DELIVERY TRACKING
// ----------------------------------------------------------------------
export async function toggleBookingDelivered(
  bookingId: string,
  delivered: boolean,
  user: { uid: string; displayName: string }
): Promise<void> {
  const ref = doc(db, "bookings", bookingId);
  const now = new Date().toISOString();
  await updateDoc(ref, {
    delivered,
    deliveredAt: delivered ? now : null,
    updatedAt: now,
  });

  await logActivity(
    user.uid,
    user.displayName,
    delivered ? "MARKED_SESSION_DELIVERED" : "MARKED_SESSION_UNDELIVERED",
    "booking",
    bookingId,
    `Marked session ${bookingId} as ${delivered ? "delivered" : "pending delivery"}`
  );
}

// ----------------------------------------------------------------------
// LEADS MANAGEMENT
// ----------------------------------------------------------------------
export async function getLeads(): Promise<Lead[]> {
  try {
    const q = query(collection(db, "leads"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Lead, "id">) }));
  } catch (err) {
    console.warn("Could not query leads collection, falling back:", err);
    return [];
  }
}

export async function createLead(
  leadData: Omit<Lead, "id" | "createdAt" | "updatedAt">,
  user: { uid: string; displayName: string }
): Promise<Lead> {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, "leads"), {
    ...leadData,
    createdAt: now,
    updatedAt: now,
  });

  await logActivity(
    user.uid,
    user.displayName,
    "CREATED_LEAD",
    "client",
    docRef.id,
    `Added new photography lead: ${leadData.clientName} (${leadData.category})`
  );

  return { id: docRef.id, ...leadData, createdAt: now, updatedAt: now };
}

export async function updateLead(
  leadId: string,
  updates: Partial<Lead>,
  user: { uid: string; displayName: string }
): Promise<void> {
  const now = new Date().toISOString();
  await updateDoc(doc(db, "leads", leadId), {
    ...updates,
    updatedAt: now,
  });

  await logActivity(
    user.uid,
    user.displayName,
    "UPDATED_LEAD",
    "client",
    leadId,
    `Updated lead status/details for ${leadId}`
  );
}

export async function deleteLead(
  leadId: string,
  user: { uid: string; displayName: string }
): Promise<void> {
  await deleteDoc(doc(db, "leads", leadId));
  await logActivity(
    user.uid,
    user.displayName,
    "DELETED_LEAD",
    "client",
    leadId,
    `Deleted inquiry lead ${leadId}`
  );
}

// ----------------------------------------------------------------------
// FOLLOW-UPS MANAGEMENT
// ----------------------------------------------------------------------
export async function getFollowUps(): Promise<FollowUp[]> {
  try {
    const q = query(collection(db, "follow_ups"), orderBy("dueDate", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FollowUp, "id">) }));
  } catch (err) {
    console.warn("Could not query follow_ups collection:", err);
    return [];
  }
}

export async function createFollowUp(
  data: Omit<FollowUp, "id" | "createdAt" | "updatedAt">,
  user: { uid: string; displayName: string }
): Promise<FollowUp> {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, "follow_ups"), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });

  await logActivity(
    user.uid,
    user.displayName,
    "CREATED_FOLLOWUP",
    "booking",
    docRef.id,
    `Created follow-up: "${data.title}" for ${data.clientName}`
  );

  return { id: docRef.id, ...data, createdAt: now, updatedAt: now };
}

export async function toggleFollowUpComplete(
  followUpId: string,
  completed: boolean,
  user: { uid: string; displayName: string }
): Promise<void> {
  const now = new Date().toISOString();
  await updateDoc(doc(db, "follow_ups", followUpId), {
    completed,
    updatedAt: now,
  });

  await logActivity(
    user.uid,
    user.displayName,
    completed ? "COMPLETED_FOLLOWUP" : "REOPENED_FOLLOWUP",
    "booking",
    followUpId,
    `Follow-up ${completed ? "completed" : "reopened"}`
  );
}

// ----------------------------------------------------------------------
// TRASH & ARCHIVE MANAGEMENT
// ----------------------------------------------------------------------
export async function getArchivedItems(): Promise<{
  archivedPackages: PhotographyPackage[];
  cancelledBookings: Booking[];
}> {
  try {
    // Packages that have isDeleted == true
    const pkgSnap = await getDocs(collection(db, "packages"));
    const archivedPackages = pkgSnap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<PhotographyPackage, "id">) }))
      .filter((pkg) => pkg.isDeleted === true);

    // Bookings that are cancelled
    const bookingsSnap = await getDocs(
      query(collection(db, "bookings"), where("status", "==", "cancelled"))
    );
    const cancelledBookings = bookingsSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Booking, "id">),
    }));

    return { archivedPackages, cancelledBookings };
  } catch (err) {
    console.error("Error fetching archived items:", err);
    return { archivedPackages: [], cancelledBookings: [] };
  }
}

export async function restorePackage(
  packageId: string,
  user: { uid: string; displayName: string; role?: string }
): Promise<void> {
  if (user.role !== "admin") {
    throw new Error("Unauthorized: Only studio administrators can restore packages.");
  }
  const now = new Date().toISOString();
  await updateDoc(doc(db, "packages", packageId), {
    isDeleted: false,
    active: true,
    deletedAt: null,
    deletedByUid: null,
    deletedByName: null,
    updatedAt: now,
  });

  await logActivity(
    user.uid,
    user.displayName,
    "RESTORED_PACKAGE",
    "package",
    packageId,
    `Restored photography package ${packageId} to active catalog`
  );
}

export async function restoreBooking(
  bookingId: string,
  newStatus: BookingStatus,
  user: { uid: string; displayName: string }
): Promise<void> {
  const now = new Date().toISOString();
  await updateDoc(doc(db, "bookings", bookingId), {
    status: newStatus,
    updatedAt: now,
  });

  await logActivity(
    user.uid,
    user.displayName,
    "RESTORED_BOOKING",
    "booking",
    bookingId,
    `Restored cancelled booking ${bookingId} to ${newStatus}`
  );
}

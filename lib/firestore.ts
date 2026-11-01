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
} from "./types";
import { getTodayNepal } from "./utils";

// Helper: Log Studio Activity
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
// CLIENTS
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

export async function createClient(
  clientData: Omit<Client, "id" | "createdAt" | "updatedAt">,
  user: { uid: string; displayName: string }
): Promise<Client> {
  const col = collection(db, "clients");
  const now = new Date().toISOString();
  const docRef = await addDoc(col, {
    ...clientData,
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
    `Added client ${clientData.fullName} (${clientData.phone})`
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
// PACKAGES
// ----------------------------------------------------------------------
export async function getPackages(includeInactive = false): Promise<PhotographyPackage[]> {
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
    `Created package ${pkgData.name} - NPR ${pkgData.price}`
  );

  return { id: docRef.id, ...pkgData, createdAt: now, updatedAt: now };
}

// ----------------------------------------------------------------------
// BOOKINGS & SESSIONS
// ----------------------------------------------------------------------
export async function getBookings(): Promise<Booking[]> {
  const q = query(collection(db, "bookings"), orderBy("appointmentDate", "desc"));
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

export async function getUpcomingBookings(maxItems = 6): Promise<Booking[]> {
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
  return `NPN-${year}-${String(nextSeq).padStart(3, "0")}`;
}

export async function createBooking(
  data: {
    clientId: string;
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    babyName?: string;
    packageId: string;
    packageName: string;
    packagePriceSnapshot: number;
    discountAmount: number;
    discountReason?: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    location?: 'studio' | 'home' | 'outdoor';
    photographerName?: string;
    notes?: string;
    advancePaidInitial?: number;
    paymentMethodInitial?: Payment["paymentMethod"];
  },
  user: { uid: string; displayName: string }
): Promise<Booking> {
  const bookingNumber = await generateBookingNumber();
  const totalAmount = Math.max(0, data.packagePriceSnapshot - (data.discountAmount || 0));
  const advancePaid = data.advancePaidInitial || 0;
  const remainingBalance = Math.max(0, totalAmount - advancePaid);
  const now = new Date().toISOString();

  const newBooking: Omit<Booking, "id"> = {
    bookingNumber,
    clientId: data.clientId,
    clientName: data.clientName,
    clientPhone: data.clientPhone,
    clientEmail: data.clientEmail || "",
    babyName: data.babyName || "",
    packageId: data.packageId,
    packageName: data.packageName,
    packagePriceSnapshot: data.packagePriceSnapshot,
    discountAmount: data.discountAmount || 0,
    discountReason: data.discountReason || "",
    totalAmount,
    advancePaid,
    remainingBalance,
    appointmentDate: data.appointmentDate,
    startTime: data.startTime,
    endTime: data.endTime,
    status: advancePaid > 0 ? "confirmed" : "pending",
    location: data.location || "studio",
    photographerName: data.photographerName || "",
    notes: data.notes || "",
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, "bookings"), newBooking);

  if (advancePaid > 0 && data.paymentMethodInitial) {
    await recordPayment(
      {
        bookingId: docRef.id,
        bookingNumber,
        clientId: data.clientId,
        clientName: data.clientName,
        amount: advancePaid,
        paymentType: "advance",
        paymentMethod: data.paymentMethodInitial,
        paymentDate: data.appointmentDate,
        notes: `Initial advance payment upon booking ${bookingNumber}`,
      },
      user,
      false
    );
  }

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
    `Created booking ${bookingNumber} for ${data.clientName} (${data.appointmentDate})`
  );

  return { id: docRef.id, ...newBooking };
}

// ----------------------------------------------------------------------
// PAYMENTS
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

export async function generateReceiptNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const q = query(collection(db, "payments"), orderBy("createdAt", "desc"), limit(1));
  const snap = await getDocs(q);
  let nextSeq = 1;
  if (!snap.empty) {
    const last = snap.docs[0].data() as Payment;
    if (last.receiptNumber && last.receiptNumber.startsWith(`REC-${year}`)) {
      const parts = last.receiptNumber.split("-");
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num)) {
        nextSeq = num + 1;
      }
    }
  }
  return `REC-${year}-${String(nextSeq).padStart(4, "0")}`;
}

export async function recordPayment(
  data: Omit<Payment, "id" | "receiptNumber" | "recordedByUid" | "recordedByName" | "createdAt">,
  user: { uid: string; displayName: string },
  updateBookingBalance = true
): Promise<Payment> {
  const receiptNumber = await generateReceiptNumber();
  const now = new Date().toISOString();

  const newPayment: Omit<Payment, "id"> = {
    ...data,
    receiptNumber,
    recordedByUid: user.uid,
    recordedByName: user.displayName,
    createdAt: now,
  };

  const docRef = await addDoc(collection(db, "payments"), newPayment);

  if (updateBookingBalance && data.bookingId) {
    const bookingRef = doc(db, "bookings", data.bookingId);
    const bookingSnap = await getDoc(bookingRef);
    if (bookingSnap.exists()) {
      const bData = bookingSnap.data() as Booking;
      const currentAdvance = (bData.advancePaid || 0) + data.amount;
      const currentRemaining = Math.max(0, bData.totalAmount - currentAdvance);
      const newStatus = currentRemaining === 0 ? "completed" : bData.status === "pending" ? "confirmed" : bData.status;

      await updateDoc(bookingRef, {
        advancePaid: currentAdvance,
        remainingBalance: currentRemaining,
        status: newStatus,
        updatedAt: now,
      });
    }
  }

  await logActivity(
    user.uid,
    user.displayName,
    "RECORDED_PAYMENT",
    "payment",
    docRef.id,
    `Recorded payment ${receiptNumber} of NPR ${data.amount} for booking ${data.bookingNumber}`
  );

  return { id: docRef.id, ...newPayment };
}

// ----------------------------------------------------------------------
// EXPENSES
// ----------------------------------------------------------------------
export async function getExpenses(): Promise<StudioExpense[]> {
  const q = query(collection(db, "expenses"), orderBy("expenseDate", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<StudioExpense, "id">) }));
}

// ----------------------------------------------------------------------
// DASHBOARD METRICS & REVENUE TREND
// ----------------------------------------------------------------------
export interface MonthlyTrendData {
  month: string; // e.g. "Jun", "Jul", "Aug"
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

  // Generate last 6 months
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

// ----------------------------------------------------------------------
// ACTIVITY LOGS
// ----------------------------------------------------------------------
export async function getRecentActivityLogs(maxItems = 15): Promise<ActivityLog[]> {
  const q = query(
    collection(db, "activity_logs"),
    orderBy("timestamp", "desc"),
    limit(maxItems)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ActivityLog, "id">) }));
}

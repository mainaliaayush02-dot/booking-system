# Newborn Photography Nepal — Studio Manager
## Development Tracking & Changelog

### Administrator Account Provisioning (Completed & Verified)
- [x] **Target Administrator Record**:
  - Firebase Project ID: `booking-b7580`
  - Email: `newbornphotographynepal.studio@gmail.com`
  - Firebase Auth UID: `99NIadNmrqVKWyWMngiMoAmYfOf1`
  - Firestore Document: `users/99NIadNmrqVKWyWMngiMoAmYfOf1`
  - Role: `admin` (Full studio administrator permissions)
  - Active: `true`
  - Display Name: `Newborn Photography Nepal Admin`
- [x] **Trusted Provisioning Architecture**:
  - `scripts/provision-existing-admin.mjs`: CLI script utilizing `firebase-admin` to verify existing Auth user, assign custom claims (`admin: true`), and create/update Firestore user document.
  - `lib/firebase-admin.ts`: Secure server-side Firebase Admin utility supporting `FIREBASE_SERVICE_ACCOUNT_KEY` and `GOOGLE_APPLICATION_CREDENTIALS`.
  - `app/api/admin/provision/route.ts`: Secure server-side endpoint for provisioning with server credentials.
  - Zero hardcoding of credentials; preserves client-side Firestore security rules and prevents unauthorized elevation.

---

### Phase 2 — Booking Operations (Completed & Verified)
- [x] **Package Management Module (`/packages`)**:
  - Implemented full package catalog with search, category filters, and active/inactive status tabs.
  - Built `PackageModal` for creating and editing packages: name, category, price, deposit, duration, retouched photo count, outfit setups, props, family inclusion, deliverables list, and notes.
  - Implemented 1-click seeding for the 3 official website pricing tiers:
    - Newborn Starter Collection: Rs. 7,999
    - Newborn Signature Collection: Rs. 15,999
    - Newborn Luxury Royal Suite: Rs. 31,999
  - Implemented soft deactivation (`togglePackageActive`): packages are never hard-deleted if referenced historically.
  - Enforced immutable package snapshotting inside bookings so future price edits never alter historical contracted sessions.
- [x] **Client Management Module (`/clients`)**:
  - Client directory with search by parent name, phone number, and baby name.
  - Reusable `ClientModal` supporting parents, phone numbers, secondary contact, address, baby DOB, gender, and multiple siblings/children.
  - Added duplicate check by phone number to prevent duplicate parent accounts.
  - Built `ClientDetailModal` displaying full profile, children, previous sessions, upcoming sessions, and booking value.
  - Client creation modal can be opened directly from the booking scheduler without leaving the page.
- [x] **Studio Booking Calendar (`/calendar`)**:
  - Built 3 fully interactive responsive views:
    1. **Monthly Calendar**: 7-day matrix with day booking pills, session counts, and day click-throughs.
    2. **Weekly Calendar**: 7 day columns with hourly breakdown (08:00 to 19:00), displaying exact session blocks with status colors and "+ Add" on empty slots.
    3. **Daily Calendar**: Expansive day schedule with detailed cards (inclusions, baby details, photographer, start/end times).
  - Navigation controls: Previous, Next, "Today" button, Date Picker, and Month/Week/Day mode switcher.
  - Multi-criteria filtering: Search by client/ID, Photography Category filter, and Status filter.
  - Brand-aligned accessible status styling:
    - Pending: Yellow (`#B45309` / `#FEF3C7`)
    - Confirmed: Green (`#15803D` / `#DCFCE7`)
    - Completed: Blue (`#1D4ED8` / `#DBEAFE`)
    - Cancelled: Red (`#B91C1C` / `#FEE2E2`)
    - Rescheduled: Purple (`#6D28D9` / `#EDE9FE`)
- [x] **5-Section Booking Creation (`BookingModal`)**:
  - Section A: Client selection with autocomplete & instant "+ Add New Client" modal.
  - Section B: Photography details, category, package auto-fill, custom pricing, and discount calculations.
  - Section C: Appointment schedule in Asia/Kathmandu, auto-calculating end time from session duration.
  - Section D: Status selector defaulting to "Pending".
  - Section E: Live financial breakdown (base price, discount, final contracted amount).
- [x] **Appointment Conflict Detection**:
  - Strict overlap check: `(StartA < EndB) && (EndA > StartB)`.
  - Prominent real-time conflict warning banner in the booking form.
  - Cancelled bookings do not block availability.
  - Administrator override capability with explicit confirmation and mandatory reason logged to audit trail.
- [x] **Booking Lifecycle Management (`BookingDetailModal`)**:
  - View detailed booking card with package snapshot.
  - Edit booking details.
  - Reschedule booking: preserves previous date/time, checks for conflicts, and logs activity.
  - Quick status transitions (Pending -> Confirmed -> Completed).
  - Cancel booking: records reason and timestamp, frees up calendar slot, and preserves history.
- [x] **Dashboard Integration (`/`)**:
  - Connected live booking counts, today's sessions, upcoming appointments, and recent clients.
  - Clicking any dashboard appointment opens its `BookingDetailModal`.
  - Clicking any dashboard client opens their `ClientDetailModal`.
- [x] **Testing & Verification**:
  - Unit test suite (`scripts/test-phase2.mjs`) passed 100% of conflict edge cases, ID regex, snapshot immutability, and timezone consistency.
  - TypeScript compiler (`tsc --noEmit`): 0 errors.
  - Next.js production build (`next build`): 11 static pages generated with 0 errors.

---

### Phase 1 & Brand Identity (Completed & Verified)
- [x] Next.js 14 App Router, TypeScript, Tailwind CSS, Firebase SDK.
- [x] Official Newborn Photography Nepal by Navin brand palette (Deep Plum `#3D084B`, Blush Pink `#F5E5EB`, Soft White `#FFFAFC`).
- [x] Original logo at `public/brand/logo.jpg`.
- [x] Persistent sidebar, top navigation with Kathmandu date indicator, and user profile dropdown.
- [x] Hardened `firestore.rules` and `storage.rules`.

---

### Phase 3 — Accounts & Finance (Next Up — Awaiting Approval)
- [ ] Payment recording with automated advance and remaining balance calculations.
- [ ] Multi-payment support per booking with receipt generation (`REC-YYYY-XXXX`).
- [ ] Studio expense management and categorization.
- [ ] Monthly sales revenue vs actual cash collected vs expenses (Cash Profit).
- [ ] Financial dashboards.

---

### Phase 4 — Reports & Finalization (Planned)
- [ ] Monthly and yearly financial, booking, package, and client analytics.
- [ ] CSV/Excel export.
- [ ] Security audit & activity audit logs.
- [ ] Production build and Vercel deployment.

# Newborn Photography Nepal — Studio Manager
## Development Tracking & Changelog

### Brand Identity & Security Update (Completed)
- [x] **Official Brand Identity Alignment**:
  - Imported official original logo for **Newborn Photography Nepal by Navin** into `public/brand/logo.jpg`.
  - Implemented exact color system:
    - Primary Brand: `#3D084B` (Deep Plum)
    - Secondary Brand: `#68456E` (Muted Plum)
    - Main Background: `#F5E5EB` (Blush Pink)
    - Secondary Background: `#EAD1DC` (Dusty Rose)
    - Card Background: `#FFFAFC` (Soft White)
    - Main Typography: `#332A34` (Charcoal)
    - Borders: `#EBD8E1` (Soft Pink Border)
    - Muted Text: `#846F7F` (Muted Rose Grey)
  - Refined all components, persistent sidebar, top navigation, dashboard cards, buttons, badges, and empty states.
  - Implemented prominent logo display in the Sidebar header, Login screen, and Loading splash.
  - Aligned financial performance Recharts palette with Deep Plum (`#3D084B`), Muted Plum (`#68456E`), and Dusty Rose (`#A4537F`).
- [x] **Security Audit & Hardening**:
  - Audited `firestore.rules`: Eliminated unverified `!exists(...)` bypass.
  - Restricted user profile self-edits: Staff cannot escalate their own `role` or change `active` state.
  - Created `storage.rules` ensuring only authenticated studio users can upload valid image receipts and documents under 15MB.
  - Hardened multi-tenant admin provisioning in `lib/firebase-auth-provider.tsx` using an isolated secondary app instance to preserve administrator session.
- [x] **Compiler & Build Verification**:
  - `tsc --noEmit`: 0 errors.
  - `next build`: 11 static pages generated with 0 errors.

---

### Phase 1 — Foundation & Dashboard (Completed & Verified)
- [x] Initialized Next.js App Router (14.2) with TypeScript, Tailwind CSS, Lucide React, and Recharts.
- [x] Reusable Firebase initialization utilities: `lib/firebase.ts`, `lib/firestore.ts`, `lib/firebase-auth.ts`.
- [x] Complete domain TypeScript interfaces (`lib/types.ts`).
- [x] Role-based authentication & session monitoring (`admin`, `staff`, `photographer`).
- [x] Protected route architecture preventing unauthenticated access.
- [x] Persistent sidebar and responsive top navigation bar with Asia/Kathmandu timezone date.
- [x] Initial dashboard with 6 core metric cards, today's sessions, upcoming bookings, recent payments, recent clients, and monthly revenue performance chart.

---

### Phase 2 — Booking Operations (Pending Approval)
- [ ] Photography package catalog (Newborn, Maternity, Milestone, Cake Smash).
- [ ] Client directory with baby profile details (DOB, gender, parent contacts).
- [ ] Monthly interactive calendar view with Asia/Kathmandu booking slots.
- [ ] Weekly interactive calendar view with hourly breakdown.
- [ ] Daily appointment schedule view.
- [ ] Booking creation and editing with package price snapshotting and discount calculations.
- [ ] Conflict detection preventing double-booking of photography slots.
- [ ] Automatic client, package, and payment relational updates.

---

### Phase 3 — Accounts & Finance (Planned)
- [ ] Payment recording with automated advance and remaining balance calculations.
- [ ] Multi-payment support per booking with receipt generation (`REC-YYYY-XXXX`).
- [ ] Studio expense management and categorization.
- [ ] Monthly sales revenue vs actual cash collected vs expenses (Cash Profit).

---

### Phase 4 — Reports & Finalization (Planned)
- [ ] Monthly and yearly financial, booking, package, and client analytics.
- [ ] CSV/Excel report exports.
- [ ] Security audit & activity audit logs.
- [ ] Production build and Vercel deployment.

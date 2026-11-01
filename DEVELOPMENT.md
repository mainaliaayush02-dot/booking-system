# Newborn Photography Nepal — Studio Manager
## Development Tracking & Changelog

### Phase 1 — Foundation (Completed)
- [x] Initialized Next.js App Router project with TypeScript, Tailwind CSS, Lucide React, and Recharts.
- [x] Configured Firebase project credentials (`booking-b7580`) in `.env.local` and `.env.example`.
- [x] Implemented single-instance Firebase SDK initialization in `lib/firebase.ts` with browser-safe Analytics.
- [x] Defined complete domain TypeScript models in `lib/types.ts` (Clients, Packages, Bookings, Payments, Expenses, Activity Logs, Users).
- [x] Created `lib/firebase-auth.ts` and `lib/firebase-auth-provider.tsx` for authentication state, user roles, and login/logout sessions.
- [x] Implemented typed Firestore data layer in `lib/firestore.ts` including activity logging, metrics aggregation, booking conflict detection, and balance updates.
- [x] Authored initial Firestore security rules in `firestore.rules` preventing unauthenticated access and protecting financial transaction integrity.
- [x] Built design system tokens in `tailwind.config.ts` adhering to the studio's visual identity: warm ivory/cream backgrounds, soft beige accents, muted brown details, and charcoal typography.
- [x] Built `components/layout/protected-route.tsx` ensuring that all internal studio routes require authentication, redirecting unauthenticated visitors to `/login`.
- [x] Built persistent Studio Sidebar in `components/layout/sidebar.tsx` with all 7 core studio destinations and responsive mobile slide-out navigation.
- [x] Built Top Navigation Bar in `components/layout/top-nav.tsx` with live Asia/Kathmandu date formatting, user profile badge, and logout action.
- [x] Built Studio Login Screen in `app/login/page.tsx` with internal-only access, secure credentials input, and first-time admin setup helper.
- [x] Built Main Studio Dashboard in `app/page.tsx` featuring 7 financial/operational metric cards (Sales, Cash Collected, Profit, Expenses, Pending Balances), quick action buttons, upcoming photography sessions list, and live activity audit log.
- [x] Verified full build with Next.js compiler (`next build`), generating all 8 routes with 0 errors.

---

### Phase 2 — Booking Operations (Next Up)
- [ ] Photography package management (Newborn, Maternity, Milestone, Family, Cake Smash).
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
- [ ] Multi-payment support per booking with auto-incremented receipt numbers (`REC-YYYY-XXXX`).
- [ ] Studio expense management and categorization (Rent, Equipment, Props, Utilities, Marketing, etc.).
- [ ] Monthly sales revenue vs actual cash collected vs expenses (Cash Profit calculation).
- [ ] Financial dashboards.

---

### Phase 4 — Reports & Finalization (Planned)
- [ ] Monthly and yearly financial, booking, package, and client analytics.
- [ ] CSV/Excel report exports.
- [ ] Security audit & activity audit logs.
- [ ] Vercel deployment readiness and production verification.

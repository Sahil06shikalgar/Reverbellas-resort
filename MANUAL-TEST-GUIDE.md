# Riverbells Resort — Local Setup & Manual Test Guide

**Date:** 2026-09-05
**Covers:** how to run the whole site on your machine + a click-through checklist for the guest booking flow and the admin panel.

---

## ⚠️ Read this first — protect your production data

The committed `BackEnd/.env` has `MONGODB_URI` pointing at your **live production MongoDB Atlas cluster**. If you start the backend as-is, it connects to production and every test booking, payment, and status change you make will be written to your **real** database. On startup it also runs a seeder (it only seeds when the DB is empty, so it won't wipe existing data — but your test junk still lands in prod).

**Before testing, point the backend at a throwaway database.** Two easy options:

- **Local MongoDB (best):** install MongoDB Community Edition, then set
  `MONGODB_URI=mongodb://localhost:27017/riverbells_test`
- **Same Atlas cluster, separate database:** change only the database name in the URI to something like `/riverbells_test` so it's isolated from the live data. (Still uses prod credentials, so prefer the local option if you can.)

Do your testing there, and keep the production URI somewhere safe to restore later.

---

## What you need

- **Node.js 18+** and npm
- **MongoDB** — a local install (recommended) or a test Atlas database (see above)
- Two terminal windows (one for the backend, one for the frontend)

---

## Step 1 — Backend

```bash
cd BackEnd
npm install
```

Edit `BackEnd/.env` for local testing:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/riverbells_test   # ← your TEST db, not prod
JWT_SECRET=any-long-random-string-for-local
CLIENT_URL=http://localhost:5173                        # ← fixes CORS (see BUG-07)
ADMIN_EMAIL=admin@riverbells.com
ADMIN_PASSWORD=<pick-a-password>
```

Two changes matter most: `MONGODB_URI` (so you don't touch prod) and `CLIENT_URL=http://localhost:5173` (otherwise the browser blocks the frontend — BUG-07).

```bash
npm run dev        # or: npm start
```

You should see `Riverbells Backend running on http://localhost:5000`. Sanity-check the API:

```bash
curl http://localhost:5000/api/health
# → {"success":true,"message":"Riverbells Resort API is running"}
```

The server seeds sample properties and an admin user on first run against an empty DB.

## Step 2 — Frontend

```bash
cd FrontEnd
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). `FrontEnd/.env` is already corrected to `VITE_API_URL=http://localhost:5000/api` (BUG-02).

## Login

- **Admin panel:** go to `/admin/login`, use `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env`.
- **Guest flow:** no login — start at the home page or `/stay`.

---

## How to use the checklist

Tick each box as you go. Each item has **Steps** and **Expected**. If reality differs from Expected, note it. Items marked **↪ BUG-xx** are things this review already flagged in `BUG-REPORT.md` — use them to confirm the bug live and, once fixed, to verify the fix.

---

## G — Guest booking flow

### G0 — Smoke test (do this first) ↪ BUG-02
- [ ] **Steps:** Open the site, open your browser DevTools → Network tab, load the home page / properties.
- [ ] **Expected:** API requests go to `http://localhost:5000/api/...` and return `200` (not `404`). If you see calls to `:5000/bookings` with no `/api`, the env fix didn't take — restart the Vite dev server.

### G1 — Browse properties
- [ ] **Steps:** Land on home / `/stay`. View the property list.
- [ ] **Expected:** Seeded properties render with names, images, capacity, rates. No console errors.

### G2 — Create a booking (inquiry)
- [ ] **Steps:** Go to `/book-stay`. Fill customer name + mobile, pick a property, choose check-in/check-out dates and guest counts. Submit.
- [ ] **Expected:** Booking is created; you're taken to `/billing/:bookingId`. A booking code like `RB-000001` is shown.

### G3 — Validation on the booking form
- [ ] **Steps:** Try to submit with (a) no name, (b) no mobile, (c) check-out before/equal to check-in, (d) 0 adults.
- [ ] **Expected:** Each is blocked with a clear message; no booking is created.
- [ ] **Steps:** Enter a mobile like `12345` and submit. ↪ BUG-10
- [ ] **Expected:** Note whether the error message ("10-digit") matches what's actually accepted (7–15 chars).

### G4 — Availability conflict
- [ ] **Steps:** Book a property for a date range, then try to book the **same** property for overlapping dates.
- [ ] **Expected:** Second attempt is refused with a conflict/"not available" message (HTTP 409). Non-overlapping dates succeed.

### G5 — View billing
- [ ] **Steps:** On `/billing/:bookingId`, review the charges.
- [ ] **Expected:** Base = rate × nights; grand total = base − discount + tax + other charges + services; balance = grand total − payments. With base ₹8000 + tax ₹500 + a ₹1500 service and no payment, grand total = ₹10,000, balance = ₹10,000.

### G6 — Make a payment
- [ ] **Steps:** Go to the payment page, pay part of the balance (e.g. ₹4000), then the rest.
- [ ] **Expected:** Balance drops after each payment; you can't pay **more** than the outstanding balance (try ₹99999 → rejected).
- [ ] **Steps:** After full payment, continue.
- [ ] **Expected:** Redirect to `/payment-success`; balance shows ₹0.

### G7 — Access-token boundary (guest can't see others' bookings)
- [ ] **Steps:** Copy your `/billing/:bookingId` URL, change the id to a different booking's id, open it in the same tab.
- [ ] **Expected:** You should **not** be able to view or pay a booking you didn't create (no valid token for it). Note the behaviour.

---

## A — Admin panel

### A1 — Login
- [ ] **Steps:** `/admin/login`, enter admin credentials.
- [ ] **Expected:** Redirect to the admin dashboard; your session persists on refresh.
- [ ] **Steps:** Try a wrong password.
- [ ] **Expected:** "Invalid email or password"; no access.

### A2 — Auth guard
- [ ] **Steps:** Log out (or open a private window) and visit `/admin` directly.
- [ ] **Expected:** Redirected to `/admin/login`; protected pages never render without a session.

### A3 — Bookings list & search
- [ ] **Steps:** Open All Bookings. Search by customer name, mobile, and booking code. Filter by status.
- [ ] **Expected:** Results match; searching a term with regex characters (e.g. `.*`) is treated literally and doesn't error (↪ escaped in code).

### A4 — Status transitions (state machine)
- [ ] **Steps:** On an `inquiry` booking, move it `inquiry → confirmed`. Then try an illegal jump (e.g. `inquiry → completed`).
- [ ] **Expected:** Legal transitions succeed; illegal ones are rejected ("Cannot change X to Y"). Allowed path: inquiry → confirmed → checked_in → checked_out → completed (plus cancel from inquiry/confirmed).

### A5 — Check-in / check-out gating
- [ ] **Steps:** Confirm a booking, then check it in. Try to check **out** while a balance is still owed.
- [ ] **Expected:** Checkout is blocked with a "payment pending" message until the balance is ₹0. After full payment, checkout succeeds and stamps the checkout time.

### A6 — Add a service charge
- [ ] **Steps:** On a booking, add a service (e.g. "Dinner", qty 2, rate 750).
- [ ] **Expected:** Line item amount = qty × rate (₹1500); grand total and balance increase accordingly.

### A7 — Edit booking pricing ↪ BUG-04 / BUG-05
- [ ] **Steps:** On a booking that has tax and/or a discount, edit **only** the nightly rate and save. Re-open it.
- [ ] **Expected (current, buggy):** tax / discount / other charges reset to 0. Record this — it's BUG-04.
- [ ] **Steps:** Try to change children from 2 to 0 and save.
- [ ] **Expected (current, buggy):** children stays at 2 (can't set 0) — BUG-05.

### A8 — Payments (admin side)
- [ ] **Steps:** Record a payment from the admin payments screen; record a **Refund**.
- [ ] **Expected:** Payments reduce the balance; a Refund increases it back. Balance never goes below ₹0.

### A9 — Customers ↪ BUG-08
- [ ] **Steps:** Open a customer who has a booking with a Refund recorded. Check "total spent".
- [ ] **Expected (current, buggy):** total spent counts the refund as spending (inflated) and won't match the booking balance — BUG-08.

### A10 — Inventory & Properties
- [ ] **Steps:** Open Inventory and Property Settings. Edit a property (rate, capacity, active, bookable-from-website).
- [ ] **Expected:** Changes save and reflect on the guest side. A property set to **not** bookable-from-website but still active: check whether it still shows in the guest dropdown — ↪ BUG-09.

### A11 — Dashboard & Calendar
- [ ] **Steps:** Open the dashboard and the calendar view.
- [ ] **Expected:** Occupancy / revenue widgets load without errors; calendar shows bookings on the right dates.

### A12 — Invoice
- [ ] **Steps:** Generate/download an invoice for a completed booking.
- [ ] **Expected:** PDF downloads with correct customer, line items, totals, and an invoice number.

---

## E — Edge cases & validation

- [ ] **Past dates:** try booking check-in in the past — note whether it's allowed.
- [ ] **Over-capacity:** book more guests than a property allows → rejected with a capacity message.
- [ ] **Villa/room blocking:** if a villa and its rooms are linked, booking the villa should block its rooms for the same dates (and vice-versa).
- [ ] **Long/odd input:** very long names, emoji, unusual characters in notes → handled without crashing.
- [ ] **Double-submit:** click "create booking" / "pay" twice quickly → no duplicate booking/payment.
- [ ] **Refresh mid-flow:** refresh on the billing/payment page → guest access still works within the same tab (sessionStorage); note behaviour after closing the tab.

---

## S — Security checks (please do these)

- [ ] **S1 — Admin self-registration ↪ BUG-01 (Critical).** Run:
  ```bash
  curl -X POST http://localhost:5000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"name":"Test","email":"t@t.com","password":"pass123","role":"ADMIN"}'
  ```
  **Expected (current, buggy):** `201` + a token, and you can then log in at `/admin/login` as an admin. This must be fixed before the site is public.
- [ ] **S2 — Protected routes need a token.** Call a protected endpoint with no auth, e.g. `curl http://localhost:5000/api/dashboard`. Expected: `401`.
- [ ] **S3 — Payment can't exceed balance.** Try to POST a payment larger than the balance → rejected.
- [ ] **S4 — Secrets ↪ BUG-03.** Confirm `.env` isn't in git history: `git log --all --full-history -- BackEnd/.env`. If anything shows, rotate the Atlas password and `JWT_SECRET`, and change the admin password off `admin123`.

---

## Recording results

For anything that fails, jot down: which checklist item, what you did, what you expected, what actually happened, and a screenshot or the console/network error. That maps directly onto `BUG-REPORT.md`, where the already-known issues are written up with fixes.

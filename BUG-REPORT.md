# Riverbells Resort — Bug Report

**Date:** 2026-09-05
**Scope:** Whole site — guest booking flow + admin panel (frontend + backend)
**Method:** Static code review against the app's own behaviour and the project's e2e spec.

> **Why static review, not live clicking?** This app needs MongoDB, `npm install`, and a Vite build to run. In the review sandbox, MongoDB isn't available, `npm` is blocked, and the committed `node_modules` are Windows builds (native binaries won't load on Linux), so neither the backend nor the frontend could be booted here. Instead, every finding below was traced directly in the source with exact `file:line` references so you can reproduce and fix each one on your own machine. Setup + a click-through checklist to confirm these live are in **MANUAL-TEST-GUIDE.md**.
>
> **I did not run anything against your database.** The committed `BackEnd/.env` points `MONGODB_URI` at your **live production Atlas cluster**, so no write/test operations were executed. See BUG-03 and the guide's safety note before you test.

---

## Summary

| ID | Severity | Area | Issue | Status |
|----|----------|------|-------|--------|
| BUG-01 | 🔴 Critical | Backend / Auth | Anyone can create an ADMIN account (unauthenticated `/register`, client-controlled role) | Open |
| BUG-02 | 🟠 High | Frontend / Config | `VITE_API_URL` had a leading space + missing `/api` → all API calls 404 locally | **Fixed by me** |
| BUG-03 | 🟠 High | Secrets / Ops | Live prod DB password, JWT secret & weak admin password in `.env`; repo has a public GitHub remote | Open (action needed) |
| BUG-04 | 🟡 Medium | Backend / Billing | Editing a booking's price wipes tax / discount / other charges to 0 | Open |
| BUG-05 | 🟡 Medium | Backend / Booking | Can't set adults/children back down (e.g. children → 0) on update | Open |
| BUG-06 | 🟡 Medium | Backend / Data | Booking & customer codes use `count + 1` → race conditions / collisions | Open |
| BUG-07 | 🟡 Medium | Backend / Config | CORS blocks `localhost:5173`, so the local frontend can't call the API | Open (config for local run) |
| BUG-08 | 🟢 Low | Backend / Data | Customer "total spent" counts refunds as spend & pending as paid (inconsistent with billing) | Open |
| BUG-09 | 🟢 Low | Frontend / UX | Booking dropdown lists properties that availability can never confirm | Open |
| BUG-10 | 🟢 Low | Frontend / UX | Mobile-number error message says "10 digits" but the rule accepts 7–15 chars | Open |
| BUG-11 | 🟢 Low | Tooling | `e2e-test.mjs` is stale: connects to prod DB and hits now-protected routes (401s) | Open |

Legend: 🔴 fix before anyone uses it · 🟠 fix before deploy · 🟡 fix soon · 🟢 polish

---

## 🔴 Critical

### BUG-01 — Anyone can register themselves as ADMIN

**Where:** `BackEnd/routes/authRoutes.js:13` and `BackEnd/controllers/authController.js:15,35`

```js
// authRoutes.js
router.post("/register", register);          // ← no `protect`, no `authorize`

// authController.js
const { name, email, password, role = "STAFF" } = req.body;   // role from the client
...
const user = await User.create({ name, email, password, role }); // role trusted as-is
res.status(201).json({ data: { user: user.toPublic(), token: signToken(user) } }); // returns a JWT
```

**Impact:** The `/api/auth/register` endpoint is public **and** takes `role` straight from the request body, then hands back a valid JWT. Any stranger on the internet can create themselves an **ADMIN** account and log straight into the admin panel — full unauthenticated privilege escalation. This is the most serious issue on the site.

**Reproduce:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Attacker","email":"evil@x.com","password":"pass123","role":"ADMIN"}'
# → 201 Created, returns an admin token. Now log in at /admin/login.
```

**Suggested fix (pick one, ideally both):**
- Lock the route down: `router.post("/register", protect, authorize("ADMIN"), register);` so only a logged-in admin can create staff.
- Never trust the client's role: in `register`, drop `role` from `req.body` and force `role: "STAFF"` (or omit it and let the schema default apply). Admins get promoted through a separate, protected admin-only path.

---

## 🟠 High

### BUG-02 — Frontend API base URL was broken *(fixed)*

**Where:** `FrontEnd/.env:1`

```
# before
VITE_API_URL= http://localhost:5000     ← leading space + no /api suffix
# after (fixed)
VITE_API_URL=http://localhost:5000/api
```

**Impact:** `FrontEnd/src/services/api.js` only falls back to `.../api` when `VITE_API_URL` is *unset*. Because it was set (to a value without `/api`), every request went to e.g. `http://localhost:5000/bookings` instead of `http://localhost:5000/api/bookings`. The backend mounts everything under `/api` (`server.js:76-87`), so **every** call would 404 — the whole app is dead on arrival locally. The leading space is an additional hazard.

**Status:** I corrected the file. After pulling, run the frontend and confirm requests hit `/api/...` (see checklist G0). No further action needed unless you deploy — set the deployed frontend's `VITE_API_URL` to your API's public URL + `/api`.

---

### BUG-03 — Live secrets in the working tree; repo is on public GitHub

**Where:** `BackEnd/.env` (real `MONGODB_URI` with password, real 128-char `JWT_SECRET`, `ADMIN_PASSWORD=admin123`). Remote: `github.com/Sahil06shikalgar/Reverbellas-resort` (`.git/config:9`).

**Good news:** `.env` is correctly listed in both `.gitignore` files (root and `BackEnd/`), so it *shouldn't* be in the repo going forward.

**The risks that remain:**
1. **If `.env` was ever committed before the ignore rule was added, it's in your public GitHub history** — meaning the Atlas password and JWT secret are effectively public. I couldn't check git history in this environment; you must verify:
   ```bash
   git log --all --full-history -- BackEnd/.env FrontEnd/.env
   ```
   If *any* commit shows up, treat the Atlas DB password and `JWT_SECRET` as leaked and **rotate both now** (a leaked `JWT_SECRET` lets anyone forge admin tokens; a leaked DB password gives direct database access).
2. **Weak admin password:** `ADMIN_PASSWORD=admin123`. Combined with the known admin email, this is trivially guessable. Change it to something strong.
3. Even if never committed, these are *production* credentials sitting in your local tree — handle accordingly and never paste them into issues/screenshots.

**Suggested fix:** Verify history as above; rotate Atlas password + `JWT_SECRET` if exposed; set a strong `ADMIN_PASSWORD`; keep using a separate test database for local work (see the guide).

---

## 🟡 Medium

### BUG-04 — Editing a booking's price silently zeroes tax / discount / other charges

**Where:** `BackEnd/controllers/bookingController.js:453-466` (`updateBooking`)

```js
if (pricing) {
  booking.pricing = {
    ...booking.pricing,
    ratePerNight,
    nights: finalNights,
    baseAmount,
    discountType:  pricing.discountType  ?? booking.pricing.discountType ?? "fixed",
    discountValue: Number(pricing.discountValue ?? 0),   // ← omitted → 0
    discountAmount,
    taxAmount:     Number(pricing.taxAmount ?? 0),        // ← omitted → 0
    otherCharges:  Number(pricing.otherCharges ?? 0)      // ← omitted → 0
  };
}
```

**Impact:** If a `pricing` object is sent with only *some* fields (e.g. admin edits just the nightly rate), the omitted fields default to `0`. A booking that had ₹500 tax and a discount loses both the moment someone tweaks the rate. Silent revenue/data loss.

**Reproduce:** Create a booking with `taxAmount: 500`. Update it with `pricing: { ratePerNight: 9000 }`. Re-fetch → `taxAmount` is now `0`, discount gone.

**Suggested fix:** Merge each field with the previous value instead of defaulting to 0, e.g. `taxAmount: Number(pricing.taxAmount ?? booking.pricing.taxAmount ?? 0)` (same for `discountValue` and `otherCharges`).

---

### BUG-05 — Can't reduce adults/children on an existing booking

**Where:** `BackEnd/controllers/bookingController.js:403,421` (`updateBooking`)

```js
if (adults || children) { ... }                       // line 403
const finalChildren = children || booking.children;   // line 421
```

**Impact:** `children: 0` is falsy, so `children || booking.children` keeps the old value — you can never correct a booking down to 0 children. The `adults || children` guard on line 403 also skips the capacity re-check when `children` is `0`. Same falsy-value trap would bite `adults` if it were ever legitimately lowered.

**Suggested fix:** Use nullish coalescing and explicit presence checks: `const finalChildren = children ?? booking.children;` and gate recalculation on `adults !== undefined || children !== undefined`.

---

### BUG-06 — Booking / customer codes are generated with `count + 1`

**Where:** `BackEnd/controllers/bookingController.js:17-27`

```js
const generateBookingCode = async () => {
  const count = await Booking.countDocuments();
  return `RB-${String(count + 1).padStart(6, "0")}`;
};
```

**Impact:** Two bookings created at the same instant both read the same count and get the **same code** (e.g. `RB-000042`). Deleting any booking also makes the next code collide with an existing one. `generateCustomerCode` and `BackEnd/services/invoiceService.js` (invoice numbers) share this pattern.

**Suggested fix:** Use an atomic counter (a `Counters` collection updated with `findOneAndUpdate({...},{$inc:{seq:1}})`), or a unique index on the code plus retry-on-duplicate, or switch to a non-sequential unique id.

---

### BUG-07 — CORS blocks the local frontend

**Where:** `BackEnd/server.js:32-49`

```js
const allowedOrigins = [
  "https://reverbellas-resort-3.onrender.com",
  process.env.CLIENT_URL,
].filter(Boolean).map((o) => o.trim());
// origin allowed only if it's in that list
```

**Impact:** With the committed `.env`, `CLIENT_URL` is the Render URL, so the local Vite dev server at `http://localhost:5173` is **not** in `allowedOrigins`. The browser blocks every cross-origin API call and the local app can't talk to the local backend — even after BUG-02 is fixed.

**Suggested fix (for local testing):** In `BackEnd/.env`, set `CLIENT_URL=http://localhost:5173` while testing locally (this is exactly what `.env.example` uses). Restore the production value before deploying. Full steps are in MANUAL-TEST-GUIDE.md.

---

## 🟢 Low

### BUG-08 — "Total spent" on a customer counts refunds as spending

**Where:** `BackEnd/controllers/customerController.js:131-136`

```js
const totalSpent = payments.reduce(
  (sum, p) => (p.status !== "cancelled" ? sum + Number(p.amount || 0) : sum),
  0
);
```

**Impact:** This adds **every** non-cancelled payment, including `paymentType: "Refund"` rows (which have positive amounts). So a refund *increases* a customer's "total spent". It also counts `pending` payments as spent. This disagrees with the real billing math in `billingService.js:58-62`, which counts only `completed` payments and **subtracts** refunds. The customer profile figure will drift from actual booking balances whenever refunds or pending rows exist.

**Suggested fix:** Reuse the billing logic — count only `status === "completed"` and subtract `Refund` amounts — so the customer total matches booking balances.

---

### BUG-09 — Booking dropdown shows properties that can never be "available"

**Where:** `FrontEnd/src/pages/BookStay.jsx` (property dropdown filters on `active`) vs `BackEnd/services/availabilityService.js` `searchAvailability` (requires `active` **and** `bookableFromWebsite`).

**Impact:** A property that is `active` but has `bookableFromWebsite: false` appears in the guest's dropdown, but the availability search will never return it — so selecting it always shows the "not available" warning with no way forward. Confusing dead-end for guests.

**Suggested fix:** Filter the guest dropdown by `bookableFromWebsite === true` as well, so it only lists properties the public can actually book.

---

### BUG-10 — Mobile-number error message doesn't match the rule

**Where:** `FrontEnd/src/pages/BookStay.jsx` (mobile validation)

**Impact:** The validation regex accepts 7–15 characters including `+`, `-` and spaces, but the error text tells the user to enter a "valid 10-digit mobile number." Minor confusion when validation fails. Also worth deciding whether you actually want to accept 7-digit numbers.

**Suggested fix:** Make the message match the rule (or tighten the rule to 10 digits if that's the real requirement).

---

### BUG-11 — `e2e-test.mjs` is stale and points at production

**Where:** `BackEnd/e2e-test.mjs`

**Impact:** The script does `mongoose.connect(process.env.MONGODB_URI)` — i.e. it runs against whatever `.env` points to, currently **production Atlas** — and it never authenticates, so it calls routes that are now `protect`-ed and will get `401`s. As written it's both unsafe (touches prod) and broken (fails on auth). Don't run it as-is.

**Suggested fix:** Point it at a dedicated test database, add a login step to get a token and send it on protected calls, and refresh the expectations to match the current routes. The manual checklist in MANUAL-TEST-GUIDE.md covers the same flows safely in the meantime.

---

## Things that are working well

Worth noting, because the review wasn't only looking for problems:

- **Payment security is solid.** `paymentController` forces `status: "completed"` server-side and rejects payments greater than the outstanding balance — clients can't fake a paid booking.
- **Checkout is money-safe.** Both `checkout` and the `checked_out` status transition block if `balance > 0` (`bookingController.js:537-548,643-652`).
- **The booking state machine is enforced** with an explicit allowed-transitions map (`bookingController.js:518-525`) — no illegal jumps.
- **Guest access tokens are handled carefully:** constant-time comparison (`utils/bookingAccess.js`), token returned only once at creation, stored in `sessionStorage`.
- **Search input is regex-escaped** (`bookingController.js:277`), avoiding regex-injection.
- **Availability logic** correctly handles overlapping dates and parent-villa/child-room blocking.

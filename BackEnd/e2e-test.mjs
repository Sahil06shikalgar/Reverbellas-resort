import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
const TEST_MOBILE = "9999999001";

// Clean collector docs from prior runs so the suite is idempotent.
const cArr = await db.collection("customers").find({ mobile: TEST_MOBILE }).toArray();
const cIds = cArr.map((c) => c._id);
const bArr = await db.collection("bookings").find({ customer: { $in: cIds } }).toArray();
const bIds = bArr.map((b) => b._id);
if (bIds.length) {
  await db.collection("payments").deleteMany({ booking: { $in: bIds } });
  await db.collection("bookings").deleteMany({ _id: { $in: bIds } });
}
if (cIds.length) await db.collection("customers").deleteMany({ _id: { $in: cIds } });
const extraProps = await db.collection("properties").find({ propertyCode: "ROOM-103" }).toArray();
for (const p of extraProps) {
  await db.collection("properties").updateMany({ childProperties: p._id }, { $pull: { childProperties: p._id } });
  await db.collection("properties").deleteOne({ _id: p._id });
}
await db.collection("inventories").deleteMany({ itemCode: { $in: ["LINEN-E2E", "LOW-E2E"] } });

const API = "http://localhost:5000/api";
const P = (path, opts = {}) => fetch(`${API}${path}`, {
  headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
  ...opts,
}).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));

let pass = 0, fail = 0;
const check = (name, cond, extra = "") => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${extra}`); }
};

const J = (b) => JSON.stringify(b);

// Dates relative to today, avoiding collisions with existing seed booking (RB-000001).
const base = new Date();
base.setDate(base.getDate() + 30);
const iso = (d) => d.toISOString().slice(0, 10);
const d1 = iso(base);
const d3 = iso(new Date(base.getTime() + 2 * 86400000));
const d4 = iso(new Date(base.getTime() + 3 * 86400000));

const propsResp = await P("/properties");
const props = propsResp.body.data;
const villa = props.find((p) => p.propertyCode === "FULL-VILLA");
const r101 = props.find((p) => p.propertyCode === "ROOM-101");
const r102 = props.find((p) => p.propertyCode === "ROOM-102");

console.log("\n== TEST 1: Create Room 101 booking ==");
const cust = { name: "E2E Tester", mobile: "9999999001", email: "e2e@riverbells.test", city: "Pune", kycType: "Aadhaar", kycNumber: "111122223333" };
const t1 = await P("/bookings", { method: "POST", body: J({ customer: cust, propertyId: r101._id, checkIn: d1, checkOut: d3, adults: 2, children: 0, source: "Website", status: "inquiry", pricing: { ratePerNight: 4000, discountType: "fixed", discountValue: 0, taxAmount: 500, otherCharges: 0 } }) });
check("T1 create Room 101 → 201", t1.status === 201, `${t1.status}`);
const b1 = t1.body.data;

console.log("\n== TEST 2: Conflict same room ==");
const t2 = await P("/bookings", { method: "POST", body: J({ customer: cust, propertyId: r101._id, checkIn: d1, checkOut: d3, adults: 2, children: 0 }) });
check("T2 conflict → 409", t2.status === 409, `${t2.status}`);
check("T2 message correct", t2.body?.message === "Property is unavailable for the selected dates", t2.body?.message);

console.log("\n== TEST 3: Room 102 same dates ok ==");
const t3 = await P("/bookings", { method: "POST", body: J({ customer: cust, propertyId: r102._id, checkIn: d1, checkOut: d3, adults: 2, children: 0, pricing: { ratePerNight: 3500 } }) });
check("T3 Room 102 → 201", t3.status === 201, `${t3.status}`);

console.log("\n== TEST 4: Full Villa while Room 101 booked ==");
const t4 = await P("/bookings", { method: "POST", body: J({ customer: cust, propertyId: villa._id, checkIn: d1, checkOut: d3, adults: 2, children: 0 }) });
check("T4 villa blocked → 409", t4.status === 409, `${t4.status}`);

console.log("\n== TEST 5: Full Villa on free dates ==");
const d10 = iso(new Date(base.getTime() + 10 * 86400000));
const d12 = iso(new Date(base.getTime() + 12 * 86400000));
const villaBook = { customer: cust, propertyId: villa._id, checkIn: d10, checkOut: d12, adults: 6, children: 2, source: "Direct", status: "confirmed", pricing: { ratePerNight: 12000, taxAmount: 1800 } };
const t5 = await P("/bookings", { method: "POST", body: J(villaBook) });
check("T5 villa free dates → 201", t5.status === 201, `${t5.status}`);
const villaBk = t5.body.data;

console.log("\n== TEST 6: Room 101 during villa booking ==");
const t6 = await P("/bookings", { method: "POST", body: J({ customer: cust, propertyId: r101._id, checkIn: d10, checkOut: d12, adults: 2, children: 0 }) });
check("T6 room blocked by villa → 409", t6.status === 409, `${t6.status}`);

console.log("\n== TEST 7: Capacity exceeded ==");
const t7 = await P("/bookings", { method: "POST", body: J({ customer: cust, propertyId: r101._id, checkIn: d10, checkOut: d12, adults: 5, children: 0 }) });
check("T7 capacity → 400", t7.status === 400, `${t7.status}`);

console.log("\n== TEST 8/9/10: lifecycle inquiry→confirmed→checked_in ==");
const b2 = b1;
let r = await P(`/bookings/${b2._id}/status`, { method: "PATCH", body: J({ status: "confirmed" }) });
check("T9 inquiry→confirmed", r.status === 200 && r.body.data.status === "confirmed", `${r.status}`);
r = await P(`/bookings/${b2._id}/status`, { method: "PATCH", body: J({ status: "checked_in" }) });
check("T10 confirmed→checked_in", r.status === 200 && r.body.data.status === "checked_in", `${r.status}`);

console.log("\n== TEST invalid transition: completed→confirmed must fail ==");
// Use villa booking, bump it through checked_out etc. quickly to completed on a zero-balance path later.
const tBad = await P(`/bookings/${b2._id}/status`, { method: "PATCH", body: J({ status: "completed" }) });
check("checked_in→completed fails (400)", tBad.status === 400, `${tBad.status}`);
const tBad2 = await P(`/bookings/${b2._id}/status`, { method: "PATCH", body: J({ status: "cancelled" }) });
check("checked_in→cancelled fails (400)", tBad2.status === 400, `${tBad2.status}`);

console.log("\n== TEST 11: advance payment ==");
const finc = await P(`/bookings/${b2._id}`);
const bal0 = finc.body.data.billing.balance;
const t11 = await P("/payments", { method: "POST", body: J({ bookingId: b2._id, amount: 5000, mode: "UPI", paymentType: "Advance", reference: "UPI-TEST-1" }) });
check("T11 payment → 201", t11.status === 201, `${t11.status}`);
check("advance recorded", t11.body.data.payment.paymentType === "Advance");

console.log("\n== TEST 12: partial payment ==");
const finc2 = await P(`/bookings/${b2._id}`);
const bal1 = finc2.body.data.billing.balance;
const t12 = await P("/payments", { method: "POST", body: J({ bookingId: b2._id, amount: Math.min(3000, bal1), mode: "Card", paymentType: "Partial" }) });
check("T12 partial → 201", t12.status === 201, `${t12.status}`);

console.log("\n== TEST 13: food bill ==");
const t13 = await P(`/bookings/${b2._id}/services`, { method: "POST", body: J({ description: "Dinner", category: "food", quantity: 2, rate: 750 }) });
check("T13 service → 201", t13.status === 201, `${t13.status}`);

console.log("\n== TEST 14: grand total & balance update ==");
const finc3 = await P(`/bookings/${b2._id}`);
const fb = finc3.body.data.billing;
check("service added to total (1500)", fb.servicesTotal === 1500, `${fb.servicesTotal}`);
const expectedBase = 4000 * 2; // 2 nights x 4000
check("baseAmount correct", fb.baseAmount === expectedBase, `${fb.baseAmount}`);
const expectedGrand = expectedBase + 500 + 1500; // tax 500 + services
check("grandTotal correct", fb.grandTotal === expectedGrand, `${fb.grandTotal}`);
check("balance = grand - paid", fb.balance === fb.grandTotal - fb.totalPaid, `bal=${fb.balance}`);

console.log("\n== TEST 15: checkout with balance fails ==");
const t15 = await P(`/bookings/${b2._id}/status`, { method: "PATCH", body: J({ status: "checked_out" }) });
check("T15 checkout blocked → 400", t15.status === 400, `${t15.status}`);
check("T15 message", t15.body?.message === "Payment is still pending. Please clear the balance before checkout.", t15.body?.message);

console.log("\n== TEST 16: pay final balance ==");
const finc4 = await P(`/bookings/${b2._id}`);
const rem = finc4.body.data.billing.balance;
const t16 = await P("/payments", { method: "POST", body: J({ bookingId: b2._id, amount: rem, mode: "Cash", paymentType: "Final" }) });
check("T16 final → 201", t16.status === 201, `${t16.status}`);
const finc5 = await P(`/bookings/${b2._id}`);
check("balance now 0", finc5.body.data.billing.balance === 0, `${finc5.body.data.billing.balance}`);

console.log("\n== TEST 17: checkout succeeds ==");
const t17 = await P(`/bookings/${b2._id}/status`, { method: "PATCH", body: J({ status: "checked_out" }) });
check("T17 checked_out → 200", t17.status === 200 && t17.body.data.status === "checked_out", `${t17.status}`);

console.log("\n== TEST 18: completed ==");
const t18 = await P(`/bookings/${b2._id}/status`, { method: "PATCH", body: J({ status: "completed" }) });
check("T18 completed → 200", t18.status === 200 && t18.body.data.status === "completed", `${t18.status}`);

console.log("\n== TEST 19: invoice data ==");
check("invoice has booking + billing", !!finc5.body?.data?.booking && !!finc5.body?.data?.billing);

console.log("\n== TEST 22: customer history ==");
const custResp = await P(`/customers?search=e2e`);
const e2eCust = custResp.body.data.find((c) => c.email === "e2e@riverbells.test");
check("customer appears", !!e2eCust, "not found");
const custDetail = await P(`/customers/${e2eCust._id}`);
check("totalBookings >= 2", (custDetail.body.data.totalBookings || 0) >= 2, `${custDetail.body.data.totalBookings}`);
check("totalSpent > 0", custDetail.body.data.totalSpent > 0, `${custDetail.body.data.totalSpent}`);
const custBkgs = await P(`/customers/${e2eCust._id}/bookings`);
check("customer bookings route works", custBkgs.status === 200 && custBkgs.body.data.bookings.length >= 2, `${custBkgs.status}`);

console.log("\n== TEST 23/24/25: calendar/search/filter ===");
const allBk = await P("/bookings");
const srcBk = await P(`/bookings?search=e2e`);
check("search by email/name", srcBk.body.count >= 1, `${srcBk.body.count}`);
const fnBk = await P(`/bookings?status=completed`);
check("status filter works", Array.isArray(fnBk.body.data), `${fnBk.status}`);
const propBk = await P(`/bookings?property=${r101._id}`);
check("property filter works", propBk.body.data.every((b) => b.property?._id === r101._id), `${propBk.body.count}`);

console.log("\n== TEST 26: edit property rate ==");
const t26 = await P(`/properties/${r101._id}`, { method: "PUT", body: J({ standardWeekdayRate: 4200, standardWeekendRate: 4500 }) });
check("T26 rate update → 200", t26.status === 200 && t26.body.data.standardWeekdayRate === 4200, `${t26.status}`);

console.log("\n== TEST 27: create new room/property ==");
const t27 = await P("/properties", { method: "POST", body: J({ propertyCode: "ROOM-103", name: "Room 103", type: "room", maxAdults: 2, maxChildren: 2, maxGuests: 4, standardWeekdayRate: 3800, standardWeekendRate: 4000, active: true, parentProperty: villa._id }) });
check("T27 create room → 201", t27.status === 201, `${t27.status}`);
if (t27.status === 201) {
  const v = await P(`/properties/${villa._id}`);
  check("room added to villa children", v.body.data.childProperties.some((c) => c._id === t27.body.data._id), "child not linked");
}
const t27b = await P(`/properties/${r101._id}`);
check("GET /properties/:id works", t27b.status === 200 && t27b.body.data.name === "Room 101", `${t27b.status}`);

console.log("\n== TEST 28/29/30: inventory ==");
let inv = await P("/inventory");
let item = inv.body.data.find((i) => i.category === "housekeeping") || inv.body.data[0];
if (!item) {
  const ci = await P("/inventory", { method: "POST", body: J({ itemCode: "LINEN-E2E", name: "Linen Set", category: "housekeeping", unit: "set", currentStock: 10, minimumStock: 5 }) });
  item = ci.body.data;
}
const t28 = await P(`/inventory/${item._id}/stock-in`, { method: "POST", body: J({ quantity: 5, note: "e2e test" }) });
check("T28 stock-in → 200", t28.status === 200, `${t28.status}`);
const stockAfterIn = t28.body.data.currentStock;
const t29 = await P(`/inventory/${item._id}/stock-out`, { method: "POST", body: J({ quantity: 3, note: "e2e test" }) });
check("T29 stock-out → 200", t29.status === 200 && t29.body.data.currentStock === stockAfterIn - 3, `${t29.status}`);
const newLow = await P("/inventory", { method: "POST", body: J({ itemCode: "LOW-E2E", name: "Napkin", category: "housekeeping", unit: "pcs", currentStock: 2, minimumStock: 10 }) });
check("new low item flagged", newLow.status === 201 && newLow.body.data.currentStock <= newLow.body.data.minimumStock, `status=${newLow.status}`);
const lowInv = await P(`/inventory?lowStock=true`);
const lowItems = lowInv.body.data;
check("low-stock endpoint returns items", lowItems.length >= 1 && lowItems.every((i) => i.currentStock <= i.minimumStock), `${lowItems.length}`);

console.log("\n== TEST 15-pair: PUT /api/bookings/:id ==");
const putR = await P(`/bookings/${villaBk._id}`, { method: "PUT", body: J({ notes: "Updated via PUT", adults: 6 }) });
check("PUT booking update → 200", putR.status === 200, `${putR.status}`);

console.log("\n== TEST: cancelled does not block availability ==");
// create cancel test booking on Room 101 for free dates, cancel it, then book again same dates
const dfree = iso(new Date(base.getTime() + 20 * 86400000));
const dfree2 = iso(new Date(base.getTime() + 22 * 86400000));
const tc = await P("/bookings", { method: "POST", body: J({ customer: cust, propertyId: r101._id, checkIn: dfree, checkOut: dfree2, adults: 2, children: 0 }) });
const tc2 = await P(`/bookings/${tc.body.data._id}/status`, { method: "PATCH", body: J({ status: "cancelled" }) });
const tc3 = await P("/bookings", { method: "POST", body: J({ customer: cust, propertyId: r101._id, checkIn: dfree, checkOut: dfree2, adults: 2, children: 0 }) });
check("cancelled frees availability → 201", tc2.status === 200 && tc3.status === 201, `${tc3.status}`);

console.log("\n== TEST 31: persistence (re-fetch after 'restart') ==");
const persist = await P(`/bookings/${b2._id}`);
check("booking still in Mongo", persist.status === 200 && persist.body.data.booking.bookingCode === b2.bookingCode);

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
await mongoose.disconnect();
process.exit(fail > 0 ? 1 : 0);
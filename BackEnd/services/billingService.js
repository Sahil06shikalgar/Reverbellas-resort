import Payment from "../models/Payment.js";

export const getNumberOfNights = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);

  const diff = end.getTime() - start.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const calculateBookingFinancials = async (booking) => {
  const pricing = booking.pricing || {};

  const baseAmount =
    Number(pricing.baseAmount || 0);

  let discountAmount =
    Number(pricing.discountAmount || 0);

  if (pricing.discountType === "percentage") {
    discountAmount =
      (baseAmount * Number(pricing.discountValue || 0)) / 100;
  }

  discountAmount = Math.min(
    discountAmount,
    baseAmount
  );

  const afterDiscount =
    Math.max(0, baseAmount - discountAmount);

  const tax =
    Number(pricing.taxAmount || 0);

  const otherCharges =
    Number(pricing.otherCharges || 0);

  const servicesTotal = (booking.services || []).reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const grandTotal =
    afterDiscount +
    tax +
    otherCharges +
    servicesTotal;

  const payments = await Payment.find({
    booking: booking._id
  });

  // Only payments that have actually been collected count toward the balance.
  // Pending or cancelled rows must never let a booking check out on money that
  // was not received. Refunds reduce the collected total.
  const totalPaid = payments.reduce((sum, payment) => {
    if (payment.status !== "completed") return sum;
    const amount = Number(payment.amount || 0);
    return payment.paymentType === "Refund" ? sum - amount : sum + amount;
  }, 0);

  const balance = Math.max(
    0,
    grandTotal - totalPaid
  );

  return {
    baseAmount,
    discountAmount,
    afterDiscount,
    tax,
    otherCharges,
    servicesTotal,
    grandTotal,
    totalPaid,
    balance,
    payments
  };
};
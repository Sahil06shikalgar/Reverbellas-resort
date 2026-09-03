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

  const totalPaid = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

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
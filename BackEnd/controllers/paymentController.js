import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import {
  calculateBookingFinancials
} from "../services/billingService.js";

const generatePaymentCode = async () => {
  const count =
    await Payment.countDocuments();

  return `PAY-${String(count + 1).padStart(6, "0")}`;
};

export const addPayment = async (
  req,
  res,
  next
) => {
  try {
    const {
      bookingId,
      amount,
      mode,
      reference = "",
      paymentType = "Partial",
      paymentDate,
      notes = ""
    } = req.body;

    // Payment status is server-controlled. A client (especially the public
    // guest payment page) must never be able to declare a payment "completed"
    // or "pending" on its own, since that directly drives the balance and the
    // ability to check out.
    const status = "completed";

    const booking =
      await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be a number greater than 0"
      });
    }

    const before =
      await calculateBookingFinancials(booking);

    if (numericAmount > before.balance) {
      return res.status(400).json({
        success: false,
        message:
          `Payment cannot exceed balance of ₹${before.balance}`
      });
    }

    const payment =
      await Payment.create({
        paymentCode:
          await generatePaymentCode(),

        booking: bookingId,
        amount: numericAmount,
        mode,
        reference,
        paymentType,
        paymentDate: paymentDate ? new Date(paymentDate) : undefined,
        notes,
        status
      });

    const after =
      await calculateBookingFinancials(booking);

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: {
        payment,
        billing: after
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingPayments = async (
  req,
  res,
  next
) => {
  try {
    const payments =
      await Payment.find({
        booking: req.params.bookingId
      }).sort({
        paymentDate: -1
      });

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

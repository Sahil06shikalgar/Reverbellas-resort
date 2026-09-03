import Customer from "../models/Customer.js";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";

export const getCustomerBookings = async (
  req,
  res,
  next
) => {
  try {
    const customer =
      await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    const bookings =
      await Booking.find({ customer: customer._id })
        .populate("property", "name propertyCode")
        .sort({ createdAt: -1 });

    const bookingIds =
      bookings.map((b) => b._id);

    const payments =
      bookingIds.length > 0
        ? await Payment.find({ booking: { $in: bookingIds } })
        : [];

    res.json({
      success: true,
      count: bookings.length,
      data: {
        customer,
        bookings,
        payments
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomers = async (
  req,
  res,
  next
) => {
  try {
    const { search } = req.query;

    const query = {};

    if (search) {
      const term = search.trim();
      query.$or = [
        { name: { $regex: term, $options: "i" } },
        { mobile: { $regex: term, $options: "i" } },
        { email: { $regex: term, $options: "i" } },
        { city: { $regex: term, $options: "i" } }
      ];
    }

    const customers =
      await Customer.find(query).sort({ createdAt: -1 });

    const customerIds =
      customers.map((c) => c._id);

    const bookings =
      customerIds.length > 0
        ? await Booking.find({ customer: { $in: customerIds } })
            .populate("property", "name propertyCode")
            .sort({ checkIn: -1 })
        : [];

    const enriched = customers.map((c) => {
      const cBookings =
        bookings.filter((b) => b.customer.toString() === c._id.toString());

      return {
        ...c.toObject(),
        totalBookings: cBookings.length,
        latestBooking: cBookings[0] || null
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (
  req,
  res,
  next
) => {
  try {
    const customer =
      await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    const bookings =
      await Booking.find({ customer: customer._id })
        .populate("property", "name propertyCode")
        .sort({ createdAt: -1 });

    const bookingIds =
      bookings.map((b) => b._id);

    const payments =
      bookingIds.length > 0
        ? await Payment.find({ booking: { $in: bookingIds } })
        : [];

    const totalSpent =
      payments.reduce(
        (sum, p) =>
          p.status !== "cancelled" ? sum + Number(p.amount || 0) : sum,
        0
      );

    res.json({
      success: true,
      data: {
        customer,
        bookings,
        payments,
        totalBookings: bookings.length,
        totalSpent,
        latestBooking: bookings[0] || null
      }
    });
  } catch (error) {
    next(error);
  }
};

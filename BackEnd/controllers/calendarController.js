import Booking from "../models/Booking.js";

export const getCalendar = async (req, res, next) => {
  try {
    const { startDate, endDate, propertyId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: "startDate and endDate are required"
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const query = {
      status: { $in: ["inquiry", "confirmed", "checked_in", "checked_out"] },
      checkIn: { $lt: end },
      checkOut: { $gt: start }
    };

    if (propertyId) {
      query.property = propertyId;
    }

    const bookings = await Booking.find(query)
      .populate("customer", "name mobile")
      .populate("property", "name propertyCode type");

    const data = bookings.map((b) => ({
      bookingId: b._id,
      bookingNumber: b.bookingCode,
      propertyId: b.property?._id,
      propertyName: b.property?.name,
      customerName: b.customer?.name,
      customerMobile: b.customer?.mobile,
      checkIn: b.checkIn.toISOString().slice(0, 10),
      checkOut: b.checkOut.toISOString().slice(0, 10),
      adults: b.adults,
      children: b.children,
      status: b.status.toUpperCase()
    }));

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

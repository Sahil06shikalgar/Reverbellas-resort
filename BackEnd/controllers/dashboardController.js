import Booking from "../models/Booking.js";
import Property from "../models/Property.js";
import Payment from "../models/Payment.js";
import Inventory from "../models/Inventory.js";

const startOfDay = (d = new Date()) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (d = new Date()) => {
  const date = new Date(d);
  date.setHours(23, 59, 59, 999);
  return date;
};

const startOfMonth = (d = new Date()) => {
  const date = new Date(d);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const dashboardSummary = async (req, res, next) => {
  try {
    const today = startOfDay();
    const tomorrow = startOfDay(new Date(today.getTime() + 86400000));
    const monthStart = startOfMonth();

    const [todayCheckIns, todayCheckouts, activeBookings] = await Promise.all([
      Booking.countDocuments({
        checkIn: { $gte: today, $lt: tomorrow },
        status: { $in: ["confirmed", "checked_in"] }
      }),
      Booking.countDocuments({
        checkOut: { $gte: today, $lt: tomorrow },
        status: { $in: ["checked_in", "checked_out"] }
      }),
      Booking.countDocuments({
        status: { $in: ["inquiry", "confirmed", "checked_in"] }
      })
    ]);

    const [payments, monthPayments] = await Promise.all([
      Payment.find({ status: "completed" }),
      Payment.find({ status: "completed", createdAt: { $gte: monthStart } })
    ]);

    const pendingPayments = [];
    const activeBookingsList = await Booking.find({
      status: { $in: ["inquiry", "confirmed", "checked_in"] }
    });

    // Refunds reduce the collected total, matching billingService so the
    // dashboard and the per-booking billing never disagree.
    const collectedFor = (list) =>
      list.reduce((s, p) => {
        const amount = Number(p.amount || 0);
        return p.paymentType === "Refund" ? s - amount : s + amount;
      }, 0);

    for (const booking of activeBookingsList) {
      const paid = collectedFor(
        payments.filter(
          (p) => p.booking.toString() === booking._id.toString()
        )
      );
      const pricing = booking.pricing || {};
      const base = Number(pricing.baseAmount || 0);
      const discount = Math.min(
        Number(pricing.discountAmount || 0),
        base
      );
      const grand =
        Math.max(0, base - discount) +
        Number(pricing.taxAmount || 0) +
        Number(pricing.otherCharges || 0) +
        (booking.services || []).reduce(
          (s, i) => s + Number(i.amount || 0),
          0
        );
      const balance = Math.max(0, grand - paid);
      if (balance > 0) pendingPayments.push(balance);
    }

    const pendingTotal = pendingPayments.reduce((s, v) => s + v, 0);

    const todayRevenue = collectedFor(
      payments.filter(
        (p) => p.paymentDate >= today && p.paymentDate < tomorrow
      )
    );

    const monthlyRevenue = collectedFor(monthPayments);

    const [allProperties, lowStockItems] = await Promise.all([
      Property.find({ active: true }),
      Inventory.find({ $expr: { $lte: ["$currentStock", "$minimumStock"] } })
    ]);

    const activePropIds = activeBookingsList.map(
      (b) => b.property.toString()
    );
    const occupiedIds = new Set(activePropIds);

    const occupiedIdsWithChildren = new Set();
    for (const prop of allProperties) {
      if (occupiedIds.has(prop._id.toString())) {
        occupiedIdsWithChildren.add(prop._id.toString());
        if (prop.parentProperty) {
          occupiedIdsWithChildren.add(prop.parentProperty.toString());
        }
        for (const c of prop.childProperties || []) {
          occupiedIdsWithChildren.add(c.toString());
        }
      }
    }

    const occupiedProperties = occupiedIdsWithChildren.size;

    res.json({
      success: true,
      data: {
        todayCheckIns,
        todayCheckouts,
        activeBookings,
        pendingPayments: pendingTotal,
        todayRevenue,
        monthlyRevenue,
        availableProperties: Math.max(
          0,
          allProperties.length - occupiedProperties
        ),
        occupiedProperties,
        lowStockItems: lowStockItems.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const dashboardRevenue = async (req, res, next) => {
  try {
    const payments = await Payment.find({ status: "completed" });

    const grouped = {};

    for (const p of payments) {
      const key = p.paymentDate.toISOString().slice(0, 10);
      const amount = Number(p.amount || 0);
      const signed = p.paymentType === "Refund" ? -amount : amount;
      grouped[key] = (grouped[key] || 0) + signed;
    }

    const data = Object.entries(grouped)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const dashboardOccupancy = async (req, res, next) => {
  try {
    const properties = await Property.find({ active: true });
    const bookings = await Booking.find({
      status: { $in: ["confirmed", "checked_in"] }
    });

    const data = properties.map((prop) => {
      const count = bookings.filter(
        (b) =>
          b.property.toString() === prop._id.toString() ||
          (prop.parentProperty &&
            b.property.toString() === prop.parentProperty.toString()) ||
          (prop.childProperties || []).some(
            (c) => b.property.toString() === c.toString()
          )
      ).length;

      return {
        propertyId: prop._id,
        propertyName: prop.name,
        bookings: count,
        occupied: count > 0
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const dashboardBookings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const bookings = await Booking.find(query)
      .populate("customer", "name mobile")
      .populate("property", "name propertyCode")
      .sort({ checkIn: 1 });

    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    next(error);
  }
};

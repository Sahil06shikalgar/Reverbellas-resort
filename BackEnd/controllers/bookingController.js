import Booking from "../models/Booking.js";
import Customer from "../models/Customer.js";
import Property from "../models/Property.js";

import {
  checkAvailability,
  checkCapacity
} from "../services/availabilityService.js";

import {
  getNumberOfNights,
  calculateBookingFinancials
} from "../services/billingService.js";

import { generateBookingAccessToken } from "../utils/bookingAccess.js";

const generateBookingCode = async () => {
  const count = await Booking.countDocuments();

  return `RB-${String(count + 1).padStart(6, "0")}`;
};

const generateCustomerCode = async () => {
  const count = await Customer.countDocuments();

  return `CUS-${String(count + 1).padStart(6, "0")}`;
};

export const createBooking = async (req, res, next) => {
  try {
    const {
      customer,
      propertyId,
      checkIn,
      checkOut,
      adults,
      children = 0,
      source = "Direct",
      contactChannel = "Website",
      status = "inquiry",
      pricing = {},
      notes = ""
    } = req.body;

    if (!customer?.name || !customer?.mobile) {
      return res.status(400).json({
        success: false,
        message: "Customer name and mobile are required"
      });
    }

    if (!propertyId || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message:
          "Property, check-in and check-out are required"
      });
    }

    const adultsCount = Number(adults);
    const childrenCount = Number(children);

    if (!Number.isInteger(adultsCount) || adultsCount < 1) {
      return res.status(400).json({
        success: false,
        message: "At least 1 adult is required"
      });
    }

    if (!Number.isInteger(childrenCount) || childrenCount < 0) {
      return res.status(400).json({
        success: false,
        message: "Number of children cannot be negative"
      });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid check-in or check-out date"
      });
    }

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        success: false,
        message: "Checkout must be after check-in"
      });
    }

    const property =
      await Property.findById(propertyId);

    if (!property || !property.active) {
      return res.status(404).json({
        success: false,
        message: "Property not found or inactive"
      });
    }

    const capacityResult = await checkCapacity({
      propertyId,
      adults: adultsCount,
      children: childrenCount
    });

    if (!capacityResult.valid) {
      return res.status(400).json({
        success: false,
        message: capacityResult.message
      });
    }

    const availability =
      await checkAvailability({
        propertyId,
        checkIn,
        checkOut
      });

    if (!availability.available) {
      return res.status(409).json({
        success: false,
        message: availability.reason,
        conflicts: availability.conflicts
      });
    }

    let existingCustomer =
      await Customer.findOne({
        $or: [
          { mobile: customer.mobile },
          ...(customer.email
            ? [{ email: customer.email.toLowerCase() }]
            : [])
        ]
      });

    if (!existingCustomer) {
      existingCustomer =
        await Customer.create({
          customerCode:
            await generateCustomerCode(),

          name: customer.name,
          mobile: customer.mobile,
          email: customer.email || "",
          city: customer.city || "",
          kycType: customer.kycType || "",
          kycNumber: customer.kycNumber || ""
        });
    }

    const nights =
      getNumberOfNights(checkIn, checkOut);

    if (nights < 1) {
      return res.status(400).json({
        success: false,
        message: "Checkout must be after check-in"
      });
    }

    const ratePerNight =
      Number(
        pricing.ratePerNight ??
        property.standardWeekdayRate ??
        0
      );

    const baseAmount =
      ratePerNight * nights;

    let discountAmount = 0;

    if (pricing.discountType === "percentage") {
      discountAmount =
        (baseAmount *
          Number(pricing.discountValue || 0)) /
        100;
    } else {
      discountAmount =
        Number(pricing.discountValue || 0);
    }

    discountAmount =
      Math.min(discountAmount, baseAmount);

    const accessToken = generateBookingAccessToken();

    const booking = await Booking.create({
      bookingCode:
        await generateBookingCode(),

      accessToken,

      customer: existingCustomer._id,

      property: propertyId,

      checkIn,
      checkOut,

      adults: adultsCount,
      children: childrenCount,

      source,
      contactChannel,
      status,

      pricing: {
        ratePerNight,
        nights,
        baseAmount,

        discountType:
          pricing.discountType || "fixed",

        discountValue:
          Number(pricing.discountValue || 0),

        discountAmount,

        taxAmount:
          Number(pricing.taxAmount || 0),

        otherCharges:
          Number(pricing.otherCharges || 0)
      },

      notes
    });

    const populated =
      await Booking.findById(booking._id)
        .populate("customer")
        .populate("property");

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      // accessToken is returned only here, at creation, so the guest can view
      // and pay for this booking without an account. It is never included in
      // any subsequent list/detail response.
      data: { ...populated.toObject(), accessToken }
    });
  } catch (error) {
    next(error);
  }
};

export const getBookings = async (req, res, next) => {
  try {
    const {
      status,
      property,
      search
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (property) {
      query.property = property;
    }

    if (search) {
      const term = String(search).trim();

      // Escape regex metacharacters so user input is treated literally.
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(escaped, "i");

      // Resolve related customer/property ids up front so the whole search
      // runs as a single indexed query instead of loading every booking into
      // memory and filtering in JS.
      const [matchingCustomers, matchingProperties] = await Promise.all([
        Customer.find({
          $or: [{ name: rx }, { mobile: rx }, { email: rx }]
        }).select("_id"),
        Property.find({ name: rx }).select("_id")
      ]);

      query.$or = [
        { bookingCode: rx },
        { customer: { $in: matchingCustomers.map((c) => c._id) } },
        { property: { $in: matchingProperties.map((p) => p._id) } }
      ];
    }

    const bookings = await Booking.find(query)
      .populate("customer")
      .populate("property")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (
  req,
  res,
  next
) => {
  try {
    const booking =
      await Booking.findById(req.params.id)
        .populate("customer")
        .populate("property");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    const billing =
      await calculateBookingFinancials(booking);

    res.json({
      success: true,
      data: {
        booking,
        billing
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateBooking = async (req, res, next) => {
  try {
    const booking =
      await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    const {
      checkIn,
      checkOut,
      adults,
      children,
      source,
      notes,
      pricing
    } = req.body;

    const propsChanged =
      checkIn || checkOut || adults || children;

    if (propsChanged) {
      const nights =
        getNumberOfNights(
          checkIn || booking.checkIn,
          checkOut || booking.checkOut
        );

      if (nights < 1) {
        return res.status(400).json({
          success: false,
          message: "Checkout must be after check-in"
        });
      }
    }

    if (checkIn || checkOut) {
      const availability =
        await checkAvailability({
          propertyId: booking.property,
          checkIn: checkIn || booking.checkIn,
          checkOut: checkOut || booking.checkOut,
          excludeBookingId: booking._id
        });

      if (!availability.available) {
        return res.status(409).json({
          success: false,
          message: availability.reason,
          conflicts: availability.conflicts
        });
      }
    }

    if (adults || children) {
      const capacityResult = await checkCapacity({
        propertyId: booking.property,
        adults: adults || booking.adults,
        children: children || booking.children
      });

      if (!capacityResult.valid) {
        return res.status(400).json({
          success: false,
          message: capacityResult.message
        });
      }
    }

    const finalCheckIn = checkIn || booking.checkIn;
    const finalCheckOut = checkOut || booking.checkOut;
    const finalAdults = adults || booking.adults;
    const finalChildren = children || booking.children;
    const finalNights = getNumberOfNights(finalCheckIn, finalCheckOut);

    const prevPricing = booking.pricing || {};
    const ratePerNight = Number(
      pricing?.ratePerNight ?? prevPricing.ratePerNight ?? 0
    );

    const baseAmount = ratePerNight * finalNights;

    let discountAmount = 0;

    if (pricing?.discountType === "percentage") {
      discountAmount =
        (baseAmount * Number(pricing?.discountValue ?? 0)) / 100;
    } else if (pricing) {
      discountAmount =
        Number(pricing.discountValue ?? 0);
    } else {
      discountAmount = Number(prevPricing.discountAmount || 0);
    }

    discountAmount = Math.min(discountAmount, baseAmount);

    booking.checkIn = finalCheckIn;
    booking.checkOut = finalCheckOut;
    booking.adults = finalAdults;
    booking.children = finalChildren;

    if (source !== undefined) booking.source = source;
    if (notes !== undefined) booking.notes = notes;

    if (pricing) {
      booking.pricing = {
        ...booking.pricing,
        ratePerNight,
        nights: finalNights,
        baseAmount,

        discountType: pricing.discountType ?? booking.pricing.discountType ?? "fixed",
        discountValue: Number(pricing.discountValue ?? 0),
        discountAmount,

        taxAmount: Number(pricing.taxAmount ?? 0),
        otherCharges: Number(pricing.otherCharges ?? 0)
      };
    } else if (ratePerNight !== prevPricing.ratePerNight) {
      booking.pricing = {
        ...booking.pricing,
        ratePerNight,
        nights: finalNights,
        baseAmount,
        discountAmount
      };
    }

    await booking.save();

    const populated =
      await Booking.findById(booking._id)
        .populate("customer")
        .populate("property");

    const billing =
      await calculateBookingFinancials(populated);

    res.json({
      success: true,
      message: "Booking updated",
      data: {
        booking: populated,
        billing
      }
    });
  } catch (error) {
    next(error);
  }
};

export const changeBookingStatus = async (
  req,
  res,
  next
) => {
  try {
    const booking =
      await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    const { status } = req.body;

    const allowedTransitions = {
      inquiry: ["confirmed", "cancelled"],
      confirmed: ["checked_in", "cancelled"],
      checked_in: ["checked_out"],
      checked_out: ["completed"],
      completed: [],
      cancelled: []
    };

    if (
      !allowedTransitions[booking.status]?.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Cannot change ${booking.status} to ${status}`
      });
    }

    if (status === "checked_out") {
      const financials =
        await calculateBookingFinancials(booking);

      if (financials.balance > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Payment is still pending. Please clear the balance before checkout.",
          balance: financials.balance
        });
      }

      booking.checkedOutAt = new Date();
    }

    if (status === "checked_in") {
      booking.checkedInAt = new Date();
    }

    if (status === "completed") {
      booking.completedAt = new Date();
    }

    booking.status = status;

    await booking.save();

    res.json({
      success: true,
      message: `Booking changed to ${status}`,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

export const checkIn = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    if (booking.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        code: "INVALID_STATUS",
        message: `Booking must be confirmed before check-in (current: ${booking.status})`
      });
    }

    const availability = await checkAvailability({
      propertyId: booking.property,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      excludeBookingId: booking._id
    });

    if (!availability.available) {
      return res.status(409).json({
        success: false,
        code: "PROPERTY_CONFLICT",
        message: "Property is already booked for these dates",
        conflicts: availability.conflicts
      });
    }

    booking.status = "checked_in";
    booking.checkedInAt = new Date();
    await booking.save();

    res.json({
      success: true,
      message: "Booking checked in",
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

export const checkout = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    if (booking.status !== "checked_in") {
      return res.status(400).json({
        success: false,
        code: "INVALID_STATUS",
        message: `Booking must be checked in before checkout (current: ${booking.status})`
      });
    }

    const financials = await calculateBookingFinancials(booking);

    if (financials.balance > 0) {
      return res.status(400).json({
        success: false,
        code: "PAYMENT_PENDING",
        message: `Checkout cannot be completed because ₹${financials.balance} is still pending.`,
        pendingAmount: financials.balance
      });
    }

    booking.status = "checked_out";
    booking.checkedOutAt = new Date();
    await booking.save();

    res.json({
      success: true,
      message: "Booking checked out",
      data: { booking, billing: financials }
    });
  } catch (error) {
    next(error);
  }
};

export const getBilling = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("customer")
      .populate("property");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    const billing = await calculateBookingFinancials(booking);

    res.json({
      success: true,
      data: { booking, billing }
    });
  } catch (error) {
    next(error);
  }
};

export const addServiceCharge = async (
  req,
  res,
  next
) => {
  try {
    const booking =
      await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    const {
      description,
      category = "other",
      quantity = 1,
      rate = 0
    } = req.body;

    const amount =
      Number(quantity) * Number(rate);

    booking.services.push({
      description,
      category,
      quantity,
      rate,
      amount
    });

    await booking.save();

    const billing =
      await calculateBookingFinancials(booking);

    res.status(201).json({
      success: true,
      message: "Service charge added",
      data: {
        booking,
        billing
      }
    });
  } catch (error) {
    next(error);
  }
};
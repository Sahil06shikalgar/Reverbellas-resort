import Booking from "../models/Booking.js";
import Property from "../models/Property.js";

const ACTIVE_BOOKING_STATUSES = [
  "inquiry",
  "confirmed",
  "checked_in"
];

export const getRelatedPropertyIds = async (propertyId) => {
  const property = await Property.findById(propertyId);

  if (!property) {
    throw new Error("Property not found");
  }

  const blockedIds = new Set();

  blockedIds.add(property._id.toString());

  // Booking a child room blocks its parent villa.
  if (property.parentProperty) {
    blockedIds.add(property.parentProperty.toString());
  }

  // Booking a full villa blocks its individual child rooms.
  for (const childId of property.childProperties || []) {
    blockedIds.add(childId.toString());
  }

  return [...blockedIds];
};

export const checkCapacity = async ({
  propertyId,
  adults,
  children
}) => {
  const property = await Property.findById(propertyId);

  if (!property) {
    return {
      valid: false,
      message: "Property not found"
    };
  }

  const totalGuests =
    Number(adults || 0) + Number(children || 0);

  if (Number(adults) > property.maxAdults) {
    return {
      valid: false,
      message: `Maximum ${property.maxAdults} adults allowed`
    };
  }

  if (Number(children) > property.maxChildren) {
    return {
      valid: false,
      message: `Maximum ${property.maxChildren} children allowed`
    };
  }

  if (totalGuests > property.maxGuests) {
    return {
      valid: false,
      message: `Maximum ${property.maxGuests} total guests allowed`
    };
  }

  return {
    valid: true
  };
};

export const checkAvailability = async ({
  propertyId,
  checkIn,
  checkOut,
  excludeBookingId = null
}) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  ) {
    return {
      available: false,
      reason: "Invalid check-in/check-out dates",
      conflicts: []
    };
  }

  const relatedPropertyIds =
    await getRelatedPropertyIds(propertyId);

  const query = {
    property: {
      $in: relatedPropertyIds
    },

    status: {
      $in: ACTIVE_BOOKING_STATUSES
    },

    // overlap:
    // newStart < oldEnd AND newEnd > oldStart
    checkIn: {
      $lt: end
    },

    checkOut: {
      $gt: start
    }
  };

  if (excludeBookingId) {
    query._id = {
      $ne: excludeBookingId
    };
  }

  const conflicts = await Booking.find(query)
    .populate("property", "name propertyCode")
    .populate("customer", "name mobile");

  if (conflicts.length > 0) {
    return {
      available: false,
      reason: "Property is unavailable for the selected dates",
      conflicts
    };
  }

  return {
    available: true,
    reason: "",
    conflicts: []
  };
};

const WEEKEND_DAYS = [0, 6]; // Sunday, Saturday

export const isWeekendDate = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return false;
  return WEEKEND_DAYS.includes(d.getDay());
};

export const getNights = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  ) {
    return 0;
  }
  return Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );
};

// Build per-night price breakdown using weekday/weekend rates.
export const calculateStayPrice = ({
  checkIn,
  checkOut,
  weekdayRate,
  weekendRate
}) => {
  const nights = getNights(checkIn, checkOut);
  const start = new Date(checkIn);
  const breakdown = [];

  for (let i = 0; i < nights; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const rate = isWeekendDate(d) ? weekendRate : weekdayRate;
    breakdown.push(rate);
  }

  const stayTotal = breakdown.reduce((sum, r) => sum + r, 0);
  const averageRate = nights > 0 ? Math.round(stayTotal / nights) : 0;

  return {
    nightCount: nights,
    stayTotal,
    averageRate,
    startingRate: breakdown[0] || 0,
    priceBreakdown: breakdown,
    hasRate: breakdown.some((r) => r > 0)
  };
};

// Search all bookable overnight stays for the requested window.
export const searchAvailability = async ({
  checkIn,
  checkOut,
  adults = 0,
  children = 0
}) => {
  const nights = getNights(checkIn, checkOut);

  if (nights <= 0) {
    throw new Error("Invalid dates: check-out must be after check-in");
  }

  const totalGuests = Number(adults || 0) + Number(children || 0);

  if (totalGuests <= 0) {
    throw new Error("Please enter the number of guests");
  }

  const properties = await Property.find({
    active: true,
    bookableFromWebsite: true
  }).lean();

  const start = new Date(checkIn);
  const end = new Date(checkOut);

  const availableProperties = [];

  for (const property of properties) {
    // Capacity filter first.
    if (
      Number(adults) > Number(property.maxAdults) ||
      Number(children) > Number(property.maxChildren) ||
      totalGuests > Number(property.maxGuests)
    ) {
      continue;
    }

    const relatedPropertyIds =
      await getRelatedPropertyIds(property._id);

    const conflictCount = await Booking.countDocuments({
      property: { $in: relatedPropertyIds },
      status: { $in: ACTIVE_BOOKING_STATUSES },
      checkIn: { $lt: end },
      checkOut: { $gt: start }
    });

    if (conflictCount > 0) {
      continue;
    }

    const price = calculateStayPrice({
      checkIn,
      checkOut,
      weekdayRate: Number(property.standardWeekdayRate || 0),
      weekendRate: Number(property.standardWeekendRate || 0)
    });

    availableProperties.push({
      _id: property._id,
      propertyCode: property.propertyCode,
      name: property.name,
      type: property.type,
      description: property.description || "",
      maxAdults: property.maxAdults,
      maxChildren: property.maxChildren,
      maxGuests: property.maxGuests,
      amenities: property.amenities || [],
      images: property.images || [],
      weekdayRate: Number(property.standardWeekdayRate || 0),
      weekendRate: Number(property.standardWeekendRate || 0),
      ...price
    });
  }

  return {
    checkIn,
    checkOut,
    nights,
    adults: Number(adults),
    children: Number(children),
    availableProperties
  };
};
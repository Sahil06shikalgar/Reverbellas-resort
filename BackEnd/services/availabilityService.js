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
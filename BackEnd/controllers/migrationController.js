import Property from "../models/Property.js";
import Customer from "../models/Customer.js";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import Inventory from "../models/Inventory.js";

const safeCode = async (model, field, prefix, fallback) => {
  const count = await model.countDocuments();
  return `${prefix}-${String(count + 1).padStart(6, "0")}`;
};

export const importLegacyData = async (req, res, next) => {
  try {
    const { properties, customers, bookings, payments, inventory } =
      req.body || {};

    const result = {
      properties: { attempted: 0, created: 0, skipped: 0 },
      customers: { attempted: 0, created: 0, skipped: 0 },
      bookings: { attempted: 0, created: 0, skipped: 0 },
      payments: { attempted: 0, created: 0, skipped: 0 },
      inventory: { attempted: 0, created: 0, skipped: 0 }
    };

    const idMap = {};

    if (Array.isArray(properties) && properties.length) {
      for (const p of properties) {
        result.properties.attempted++;
        const existing = await Property.findOne({
          $or: [
            { propertyCode: p.propertyCode || p.code },
            { name: p.name }
          ]
        });
        if (existing) {
          idMap[p._id || p.id] = existing._id.toString();
          result.properties.skipped++;
          continue;
        }
        const created = await Property.create({
          propertyCode: p.propertyCode || p.code || `PRP-${Date.now()}`,
          name: p.name,
          type: p.type || "other",
          maxAdults: Number(p.maxAdults || p.adultsCapacity || 1),
          maxChildren: Number(p.maxChildren || p.childrenCapacity || 0),
          maxGuests: Number(
            p.maxGuests || p.capacity || p.maxAdults || 1
          ),
          standardWeekdayRate: Number(
            p.standardWeekdayRate || p.rate || 0
          ),
          standardWeekendRate: Number(
            p.standardWeekendRate || p.rate || 0
          ),
          description: p.description || "",
          active: p.active !== false
        });
        idMap[p._id || p.id] = created._id.toString();
        result.properties.created++;
      }
    }

    if (Array.isArray(customers) && customers.length) {
      for (const c of customers) {
        result.customers.attempted++;
        const existing = await Customer.findOne({
          mobile: c.mobile
        });
        if (existing) {
          idMap[c._id || c.id] = existing._id.toString();
          result.customers.skipped++;
          continue;
        }
        const created = await Customer.create({
          customerCode:
            c.customerCode ||
            (await safeCode(Customer, "customerCode", "CUS")),
          name: c.name,
          mobile: c.mobile,
          email: c.email || "",
          city: c.city || "",
          kycType: c.kycType || "",
          kycNumber: c.kycNumber || "",
          notes: c.notes || ""
        });
        idMap[c._id || c.id] = created._id.toString();
        result.customers.created++;
      }
    }

    if (Array.isArray(bookings) && bookings.length) {
      for (const b of bookings) {
        result.bookings.attempted++;
        const customerId =
          idMap[b.customerId] || idMap[b.customer] || b.customerId;
        if (!customerId) {
          result.bookings.skipped++;
          continue;
        }
        const created = await Booking.create({
          bookingCode:
            b.bookingCode || b.bookingNumber ||
            (await safeCode(Booking, "bookingCode", "RB")),
          customer: customerId,
          property: idMap[b.propertyId] || b.propertyId || b.property,
          checkIn: b.checkInDate || b.checkIn,
          checkOut: b.checkOutDate || b.checkOut,
          adults: Number(b.adults || 1),
          children: Number(b.children || 0),
          source: b.source || "Direct",
          status: (b.status || "inquiry").toLowerCase(),
          pricing: {
            ratePerNight: Number(
              b.ratePerNight || b.standardRate || 0
            ),
            nights: Number(b.numberOfNights || 1),
            baseAmount: Number(b.subtotal || b.baseAmount || 0),
            discountAmount: Number(b.discount || 0),
            taxAmount: Number(b.tax || 0),
            otherCharges: Number(b.otherCharges || 0)
          },
          notes: b.notes || ""
        });
        idMap[b._id || b.id] = created._id.toString();
        result.bookings.created++;
      }
    }

    if (Array.isArray(payments) && payments.length) {
      for (const p of payments) {
        result.payments.attempted++;
        const bookingId = idMap[p.bookingId] || idMap[p.booking];
        if (!bookingId) {
          result.payments.skipped++;
          continue;
        }
        try {
          await Payment.create({
            paymentCode:
              p.paymentCode ||
              (await safeCode(Payment, "paymentCode", "PAY")),
            booking: bookingId,
            amount: Number(p.amount || 0),
            mode: p.mode || p.paymentMethod || "Cash",
            reference: p.reference || "",
            paymentDate: p.paymentDate || new Date(),
            paymentType: p.paymentType || "Partial",
            notes: p.notes || ""
          });
          result.payments.created++;
        } catch (e) {
          result.payments.skipped++;
        }
      }
    }

    if (Array.isArray(inventory) && inventory.length) {
      for (const i of inventory) {
        result.inventory.attempted++;
        const existing = await Inventory.findOne({
          $or: [{ itemCode: i.itemCode || i.code }, { name: i.name }]
        });
        if (existing) {
          result.inventory.skipped++;
          continue;
        }
        await Inventory.create({
          itemCode:
            i.itemCode || i.code || `INV-${Date.now()}`,
          name: i.name,
          category: i.category || "other",
          unit: i.unit || "pcs",
          currentStock: Number(i.currentStock || 0),
          minimumStock: Number(i.minimumStock || 0),
          active: i.active !== false
        });
        result.inventory.created++;
      }
    }

    res.json({
      success: true,
      message: "Migration import completed",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

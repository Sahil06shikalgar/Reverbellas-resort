import mongoose from "mongoose";

const serviceChargeSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true
    },

    category: {
      type: String,
      enum: ["food", "service", "other"],
      default: "other"
    },

    quantity: {
      type: Number,
      min: 1,
      default: 1
    },

    rate: {
      type: Number,
      min: 0,
      default: 0
    },

    amount: {
      type: Number,
      min: 0,
      default: 0
    },

    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: true
  }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: {
      type: String,
      required: true,
      unique: true
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true
    },

    checkIn: {
      type: Date,
      required: true
    },

    checkOut: {
      type: Date,
      required: true
    },

    adults: {
      type: Number,
      required: true,
      min: 1
    },

    children: {
      type: Number,
      default: 0,
      min: 0
    },

    source: {
      type: String,
      enum: [
        "Direct",
        "Website",
        "Phone",
        "WhatsApp",
        "Walk-in",
        "Google",
        "Referral",
        "Other"
      ],
      default: "Direct"
    },

    contactChannel: {
      type: String,
      enum: ["Website", "WhatsApp", "Phone", "Walk-in", "Other"],
      default: "Website"
    },

    status: {
      type: String,
      enum: [
        "inquiry",
        "confirmed",
        "checked_in",
        "checked_out",
        "completed",
        "cancelled"
      ],
      default: "inquiry"
    },

    pricing: {
      ratePerNight: {
        type: Number,
        min: 0,
        default: 0
      },

      nights: {
        type: Number,
        min: 1,
        default: 1
      },

      baseAmount: {
        type: Number,
        min: 0,
        default: 0
      },

      discountType: {
        type: String,
        enum: ["fixed", "percentage"],
        default: "fixed"
      },

      discountValue: {
        type: Number,
        min: 0,
        default: 0
      },

      discountAmount: {
        type: Number,
        min: 0,
        default: 0
      },

      taxAmount: {
        type: Number,
        min: 0,
        default: 0
      },

      otherCharges: {
        type: Number,
        min: 0,
        default: 0
      }
    },

    services: [serviceChargeSchema],

    notes: {
      type: String,
      default: ""
    },

    checkedInAt: Date,
    checkedOutAt: Date,
    completedAt: Date
  },
  {
    timestamps: true
  }
);

bookingSchema.index({
  property: 1,
  checkIn: 1,
  checkOut: 1
});

bookingSchema.index({ customer: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ checkIn: 1 });
bookingSchema.index({ checkOut: 1 });

export default mongoose.model("Booking", bookingSchema);
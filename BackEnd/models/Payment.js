import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    paymentCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: [0, "Payment amount cannot be negative"],
    },

    mode: {
      type: String,
      enum: [
        "Cash",
        "UPI",
        "Google Pay",
        "PhonePe",
        "Card",
        "Bank Transfer",
        "Other",
      ],
      required: true,
    },

    reference: {
      type: String,
      trim: true,
      default: "",
    },

    paymentDate: {
      type: Date,
      default: Date.now,
    },

    paymentType: {
      type: String,
      enum: [
        "Advance",
        "Partial",
        "Final",
        "Refund",
        "Other",
      ],
      default: "Partial",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["completed", "pending", "cancelled"],
      default: "completed",
    },
  },
  {
    timestamps: true,
  }
);

// Faster lookup of all payments belonging to a booking
paymentSchema.index({
  booking: 1,
  paymentDate: -1,
});

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
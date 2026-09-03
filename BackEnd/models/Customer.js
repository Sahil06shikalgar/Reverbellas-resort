import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    customerCode: {
      type: String,
      unique: true,
      required: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    mobile: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ""
    },

    city: {
      type: String,
      default: ""
    },

    kycType: {
      type: String,
      enum: [
        "Aadhaar",
        "PAN",
        "Driving Licence",
        "Passport",
        "Other",
        ""
      ],
      default: ""
    },

    kycNumber: {
      type: String,
      default: ""
    },

    notes: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

customerSchema.index({ mobile: 1 });
customerSchema.index({ email: 1 });

export default mongoose.model("Customer", customerSchema);
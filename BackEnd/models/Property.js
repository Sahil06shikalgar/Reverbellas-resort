import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    propertyCode: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    type: {
      type: String,
      enum: ["villa", "room", "lawn", "tent", "other"],
      default: "other"
    },

    parentProperty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      default: null
    },

    childProperties: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property"
      }
    ],

    maxAdults: {
      type: Number,
      default: 1,
      min: 0
    },

    maxChildren: {
      type: Number,
      default: 0,
      min: 0
    },

    maxGuests: {
      type: Number,
      required: true,
      min: 1
    },

    standardWeekdayRate: {
      type: Number,
      default: 0,
      min: 0
    },

    standardWeekendRate: {
      type: Number,
      default: 0,
      min: 0
    },

    description: {
      type: String,
      default: ""
    },

    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Property", propertySchema);
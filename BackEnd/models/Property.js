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

    amenities: [
      {
        type: String,
        trim: true
      }
    ],

    // Image references. Store keys/URLs; the frontend resolves these
    // against the project's local assets (see imageMap in the frontend).
    images: [
      {
        type: String,
        trim: true
      }
    ],

    // When false, the property is not shown in the public overnight stay
    // search (e.g. event-only lawns).
    bookableFromWebsite: {
      type: Boolean,
      default: true
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
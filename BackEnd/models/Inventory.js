import mongoose from "mongoose";

const stockTxnSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["IN", "OUT"],
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"]
    },
    note: {
      type: String,
      default: ""
    },
    date: {
      type: Date,
      default: Date.now
    },
    previousStock: {
      type: Number,
      default: 0
    },
    newStock: {
      type: Number,
      default: 0
    },
    balanceAfter: {
      type: Number,
      default: 0
    }
  },
  {
    _id: true
  }
);

const inventorySchema = new mongoose.Schema(
  {
    itemCode: {
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

    category: {
      type: String,
      default: "other"
    },

    unit: {
      type: String,
      default: "pcs"
    },

    currentStock: {
      type: Number,
      default: 0,
      min: 0
    },

    minimumStock: {
      type: Number,
      default: 0,
      min: 0
    },

    active: {
      type: Boolean,
      default: true
    },

    transactions: [stockTxnSchema]
  },
  {
    timestamps: true
  }
);

inventorySchema.index({ currentStock: 1 });
inventorySchema.index({ category: 1 });
inventorySchema.index({ name: 1 });

export default mongoose.model("Inventory", inventorySchema);

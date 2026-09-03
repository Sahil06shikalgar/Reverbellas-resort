import Inventory from "../models/Inventory.js";

export const getInventory = async (
  req,
  res,
  next
) => {
  try {
    const { search, lowStock } = req.query;

    const query = {};

    if (search) {
      const term = search.trim();
      query.$or = [
        { name: { $regex: term, $options: "i" } },
        { itemCode: { $regex: term, $options: "i" } },
        { category: { $regex: term, $options: "i" } }
      ];
    }

    if (lowStock === "true") {
      query.$expr = {
        $lte: ["$currentStock", "$minimumStock"]
      };
    }

    const items =
      await Inventory.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    next(error);
  }
};

export const createInventory = async (
  req,
  res,
  next
) => {
  try {
    const {
      itemCode,
      name,
      category = "other",
      unit = "pcs",
      currentStock = 0,
      minimumStock = 0,
      active = true
    } = req.body;

    const item =
      await Inventory.create({
        itemCode,
        name,
        category,
        unit,
        currentStock: Number(currentStock),
        minimumStock: Number(minimumStock),
        active
      });

    res.status(201).json({
      success: true,
      message: "Inventory item created",
      data: item
    });
  } catch (error) {
    next(error);
  }
};

export const updateInventory = async (
  req,
  res,
  next
) => {
  try {
    const item =
      await Inventory.findByIdAndUpdate(
        req.params.id,
        {
          name: req.body.name,
          category: req.body.category,
          unit: req.body.unit,
          minimumStock: Number(req.body.minimumStock),
          active: req.body.active
        },
        { new: true, runValidators: true }
      );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found"
      });
    }

    res.json({
      success: true,
      message: "Inventory item updated",
      data: item
    });
  } catch (error) {
    next(error);
  }
};

export const stockIn = async (
  req,
  res,
  next
) => {
  try {
    const item =
      await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found"
      });
    }

    const quantity = Number(req.body.quantity);

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive number"
      });
    }

    item.currentStock += quantity;

    item.transactions.push({
      type: "IN",
      quantity,
      previousStock: item.currentStock - quantity,
      newStock: item.currentStock,
      note: req.body.note || "",
      date: new Date()
    });

    await item.save();

    res.json({
      success: true,
      message: "Stock added",
      data: item
    });
  } catch (error) {
    next(error);
  }
};

export const stockOut = async (
  req,
  res,
  next
) => {
  try {
    const item =
      await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found"
      });
    }

    const quantity = Number(req.body.quantity);

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive number"
      });
    }

    if (quantity > item.currentStock) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${item.currentStock} available`
      });
    }

    item.currentStock -= quantity;

    item.transactions.push({
      type: "OUT",
      quantity,
      previousStock: item.currentStock + quantity,
      newStock: item.currentStock,
      note: req.body.note || "",
      date: new Date()
    });

    await item.save();

    res.json({
      success: true,
      message: "Stock removed",
      data: item
    });
  } catch (error) {
    next(error);
  }
};

import Property from "../models/Property.js";

export const getProperties = async (
  req,
  res,
  next
) => {
  try {
    const properties =
      await Property.find()
        .populate("parentProperty", "name propertyCode")
        .populate("childProperties", "name propertyCode")
        .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    next(error);
  }
};

export const getPropertyById = async (
  req,
  res,
  next
) => {
  try {
    const property =
      await Property.findById(req.params.id)
        .populate("parentProperty", "name propertyCode")
        .populate("childProperties", "name propertyCode");

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found"
      });
    }

    res.json({
      success: true,
      data: property
    });
  } catch (error) {
    next(error);
  }
};

export const createProperty = async (
  req,
  res,
  next
) => {
  try {
    const property =
      await Property.create(req.body);

    if (property.parentProperty) {
      await Property.findByIdAndUpdate(
        property.parentProperty,
        {
          $addToSet: {
            childProperties: property._id
          }
        }
      );
    }

    res.status(201).json({
      success: true,
      message: "Property created",
      data: property
    });
  } catch (error) {
    next(error);
  }
};

export const updateProperty = async (
  req,
  res,
  next
) => {
  try {
    const existing =
      await Property.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Property not found"
      });
    }

    const oldParent = existing.parentProperty?.toString() || null;
    const newParent = req.body.parentProperty
      ? String(req.body.parentProperty)
      : req.body.parentProperty === null
        ? null
        : oldParent;

    const property =
      await Property.findByIdAndUpdate(
        req.params.id,
        { ...req.body, parentProperty: newParent || null },
        {
          new: true,
          runValidators: true
        }
      );

    // Re-sync parent/child relationships when the parent changed.
    if (oldParent !== newParent) {
      if (oldParent) {
        await Property.findByIdAndUpdate(
          oldParent,
          { $pull: { childProperties: property._id } }
        );
      }

      if (newParent) {
        await Property.findByIdAndUpdate(
          newParent,
          { $addToSet: { childProperties: property._id } }
        );
      }
    }

    res.json({
      success: true,
      message: "Property updated",
      data: property
    });
  } catch (error) {
    next(error);
  }
};
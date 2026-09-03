import mongoose from "mongoose";

export const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

export const validateObjectId = (req, res, next) => {
  const id = req.params.id || req.params.bookingId;

  if (id && !isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format"
    });
  }

  next();
};

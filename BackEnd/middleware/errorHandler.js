export const errorHandler = (err, req, res, next) => {
  console.error(err);

  let status = err.statusCode || 500;
  let message = err.message || "Internal server error";

  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    status = 400;
    message = `Invalid ${err.path || "ID"} format`;
  }

  // Mongoose ValidationError
  if (err.name === "ValidationError") {
    status = 400;
    const fields = Object.keys(err.errors || {});
    message = fields.length
      ? fields.map((k) => err.errors[k].message).join(", ")
      : "Validation failed";
  }

  // Mongoose / Mongo duplicate key
  if (err.code === 11000) {
    status = 409;
    const key = Object.keys(err.keyValue || {})[0] || "field";
    message = `${key} already exists`;
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && {
      stack: err.stack
    })
  });
};

import AppError from "../utils/AppError.js";

export const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || "Server error";
  let errors;

  if (err.name === "ZodError") {
    status = 400;
    errors = err.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    }));
    message = errors[0]?.message || "Validation failed";
  } else if (err.name === "CastError") {
    status = 400;
    message = "Invalid identifier";
  } else if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors || {})[0]?.message || "Validation failed";
  } else if (err.code === 11000) {
    status = 409;
    message = "Duplicate value already exists";
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Malformed JSON body";
  } else if (err.type === "entity.too.large") {
    status = 413;
    message = "Request body too large";
  }

  if (status >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
    // never leak internals in production
    if (process.env.NODE_ENV === "production") message = "Server error";
  }

  const body = { message };
  if (errors) body.errors = errors;
  if (status >= 500 && process.env.NODE_ENV !== "production") body.stack = err.stack;

  res.status(status).json(body);
};

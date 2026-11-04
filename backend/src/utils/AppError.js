// Operational error with an HTTP status code. Thrown anywhere in the request
// pipeline; Express 5 forwards async throws to the error middleware.
export default class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

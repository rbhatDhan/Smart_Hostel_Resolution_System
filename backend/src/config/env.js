// Fail fast on a mis-configured server instead of failing on the first request.
export const validateEnv = () => {
  const missing = ["MONGO_URI", "JWT_SECRET"].filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
  if (process.env.NODE_ENV === "production" && process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }
};

export const getAllowedOrigins = () =>
  (process.env.CLIENT_URL || "http://localhost:5173,http://localhost:3000")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);

export const getAllowedEmailDomains = () =>
  (process.env.ALLOWED_EMAIL_DOMAINS || "gmail.com")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

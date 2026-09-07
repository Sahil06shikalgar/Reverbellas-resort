// Centralized environment/config access with production safety checks.
//
// In production we refuse to fall back to a hardcoded JWT secret, since that
// would let anyone forge valid tokens. In development we allow a well-known
// dev secret for convenience, but warn loudly so it is never mistaken for a
// real one.

import dotenv from "dotenv";

// Load .env here as well as in server.js. Because ES module imports are
// evaluated before the top-level body of server.js runs, this guarantees the
// variables are populated before we read them below, regardless of import
// order.
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

const DEV_JWT_SECRET = "riverbells_dev_secret";

const resolveJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (secret && secret.trim()) {
    return secret;
  }

  if (isProduction) {
    throw new Error(
      "JWT_SECRET is not set. Refusing to start in production without a secret."
    );
  }

  console.warn(
    "[config] JWT_SECRET is not set — using an insecure development secret. " +
      "Set JWT_SECRET before deploying to production."
  );

  return DEV_JWT_SECRET;
};

export const JWT_SECRET = resolveJwtSecret();

export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export const isProductionEnv = isProduction;

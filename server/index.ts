// server/index.ts

import * as dotenv from "dotenv";

// Load env in two passes: .env then .env.local (override if present)
dotenv.config();
dotenv.config({ path: ".env.local", override: true });

import express from "express";
import cors from "cors";
import morgan from "morgan";

import uploadRouter from "./routes/upload";
import addressRouter from "./routes/address";

export const app = express();

// Core middleware
app.use(cors());
app.use(express.json({ limit: "1mb" })); // bump if uploads are larger
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Feature routes
app.use("/api/upload", uploadRouter);
app.use("/api/address", addressRouter);

// Port / listener
const PORT = Number(process.env.PORT || 5174);

/**
 * Only bind the HTTP listener when not under test.
 * Vitest imports `app` for SuperTest; do not start a server in tests.
 */
if (process.env.NODE_ENV !== "test") {
  const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    for (const key of required) {
      if (!process.env[key]) {
        throw new Error(`Missing env ${key}`);
      }
    }
  } else {
    for (const key of required) {
      if (!process.env[key]) {
        // eslint-disable-next-line no-console
        console.warn(`⚠️ Missing env ${key}. Running in dev without Supabase features.`);
      }
    }
  }

  // Provide a default bucket name in non-strict environments
  process.env.SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "blue-notices";

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on ${PORT}`);
  });
}

export default app;

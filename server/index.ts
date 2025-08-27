import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import uploadsRouter from "./routes/uploads.js";

const app = express();
app.use(cors());
app.use(express.json());

// Static serving for uploads in dev
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Healthcheck
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/uploads", uploadsRouter);

const port = Number(process.env.PORT) || 5174;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

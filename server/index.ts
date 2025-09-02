import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import notifyRouter from "./routes/notify.js";
import { ocrUpload } from "./routes/ocr.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/notify", notifyRouter);
app.post("/api/upload/ocr", ocrUpload);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Healthcheck
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

const port = Number(process.env.PORT) || 5174;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

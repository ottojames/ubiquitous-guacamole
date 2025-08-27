import express from "express";
import cors from "cors";
import path from "path";
import uploadsRouter from "./routes/uploads";

const app = express();
app.use(cors());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api/uploads", uploadsRouter);

const port = process.env.PORT || 5174;
app.listen(port, () => console.log(`API on http://localhost:${port}`));

import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

const router = Router();
const uploadDir = path.join(process.cwd(), "uploads", "blue-notices");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(
      null,
      `${new Date().toISOString()}-${Math.random().toString(36).slice(2,9)}-${safe}`
    );
  },
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

router.post("/blue-notice", upload.array("files"), (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  res.json({
    files: files.map((f) => ({
      id: `up_${Math.random().toString(36).slice(2,9)}`,
      filename: f.filename,
      url: `/uploads/blue-notices/${f.filename}`,
      size: f.size,
      mime: f.mimetype,
    })),
  });
});

export default router;

import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { uid } from "../../src/lib/utils";

const router = Router();
const uploadDir = path.join(process.cwd(), "uploads", "blue-notices");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${new Date().toISOString()}-${uid("file")}-${safe}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

router.post("/blue-notice", upload.array("files"), (req, res) => {
  const files = (req.files as Express.Multer.File[] || []).map((f) => ({
    id: uid("up"),
    filename: f.filename,
    url: `/uploads/blue-notices/${f.filename}`,
    size: f.size,
    mime: f.mimetype,
  }));
  res.json({ files });
});

export default router;

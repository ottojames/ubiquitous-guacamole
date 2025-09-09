// src/lib/storage.ts
import { supabase } from './supabase';

const MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  txt: 'text/plain',
  rtf: 'application/rtf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export async function uploadBlueNotice(file: File): Promise<UploadResult> {
  try {
    const uuid = crypto.randomUUID();
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    const ext = getExtension(file.name);
    const base = file.name.slice(0, file.name.length - ext.length);
    const slug = `${slugify(base)}${ext}`;
    const objectPath = `${year}/${month}/${day}/${uuid}-${slug}`;

    const contentType = file.type || MIME_BY_EXT[ext] || "application/octet-stream";

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, file, { upsert: false, contentType });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
    return { path: `${BUCKET}/${objectPath}`, publicUrl: data.publicUrl };
  } catch (error) {
    console.error("uploadBlueNotice failed", {
      error,
      env: {
        hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
        hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      bucket: BUCKET,
      file: { name: file.name, size: file.size, type: file.type },
    });
    throw new Error(upErr.message || 'Upload failed');
  }

  const { data: pub, error: urlErr } = bucket.getPublicUrl(path);
  if (urlErr || !pub?.publicUrl) {
    console.error('Get public URL failed:', { urlErr, path });
    throw new Error(urlErr?.message || 'Unable to get public URL');
  }

  return { path, publicUrl: pub.publicUrl };
}

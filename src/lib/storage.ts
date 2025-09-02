import { supabase } from "./supabase";

const BUCKET = "blue-notices" as const;

export interface UploadResult {
  path: string;
  publicUrl: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function uploadBlueNotice(file: File): Promise<UploadResult> {
  try {
    const uuid = crypto.randomUUID();
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    const slug = slugify(file.name);
    const objectPath = `${year}/${month}/${day}/${uuid}-${slug}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, file, { upsert: false, contentType: file.type });

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
    throw error instanceof Error ? error : new Error(String(error));
  }
}

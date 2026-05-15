import crypto from "node:crypto";
import path from "node:path";
import { mkdir } from "node:fs/promises";

export const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB

export function getUploadsDir(): string {
  return process.env.UPLOADS_DIR || path.join(process.cwd(), "data/uploads");
}

export async function ensureUploadsDir() {
  const dir = getUploadsDir();
  await mkdir(dir, { recursive: true });
  return dir;
}

export function safeExtension(filename: string, mime: string): string {
  const fromName = path.extname(filename).toLowerCase();
  if (fromName && /^\.[a-z0-9]{2,5}$/i.test(fromName)) return fromName;
  const map: Record<string, string> = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };
  return map[mime] ?? "";
}

export function generateStoredName(filename: string, mime: string): string {
  return `${crypto.randomUUID()}${safeExtension(filename, mime)}`;
}

export function getStoragePath(storedName: string): string {
  // Defense in depth: ensure storedName doesn't escape the uploads dir.
  const safe = path.basename(storedName);
  return path.join(getUploadsDir(), safe);
}

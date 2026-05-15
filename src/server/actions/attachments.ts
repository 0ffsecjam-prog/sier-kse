"use server";

import { revalidatePath } from "next/cache";
import { writeFile, unlink } from "node:fs/promises";

import { prisma } from "@/server/db/prisma";
import { assertAdmin, assertUser } from "@/server/auth/session";
import {
  ALLOWED_MIME,
  MAX_UPLOAD_BYTES,
  ensureUploadsDir,
  generateStoredName,
  getStoragePath,
} from "@/lib/uploads";
import type { ActionResult } from "./venues";

export async function uploadAttachmentAction(
  venueId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertUser();

  const file = formData.get("file");
  const kindRaw = (formData.get("kind") as string) ?? "OTHER";
  const kind = ["CONTRACT", "PHOTO", "INVOICE", "OTHER"].includes(kindRaw) ? kindRaw : "OTHER";

  if (!(file instanceof File)) return { ok: false, message: "Archivo inválido" };
  if (file.size === 0) return { ok: false, message: "Archivo vacío" };
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: `Archivo demasiado grande (máx ${MAX_UPLOAD_BYTES / 1024 / 1024}MB).` };
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return { ok: false, message: `Tipo de archivo no permitido (${file.type}).` };
  }

  const venue = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!venue) return { ok: false, message: "Cancha inexistente" };

  await ensureUploadsDir();
  const storedName = generateStoredName(file.name, file.type);
  const destPath = getStoragePath(storedName);

  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(destPath, buf, { mode: 0o640 });

  await prisma.venueAttachment.create({
    data: {
      venueId,
      kind: kind as "CONTRACT" | "PHOTO" | "INVOICE" | "OTHER",
      filename: file.name.slice(0, 240),
      storedName,
      mimeType: file.type,
      sizeBytes: file.size,
      uploadedById: user.id,
    },
  });

  revalidatePath(`/venues/${venueId}`);
  return { ok: true };
}

export async function deleteAttachmentAction(id: string): Promise<ActionResult> {
  await assertAdmin();
  const att = await prisma.venueAttachment.findUnique({ where: { id } });
  if (!att) return { ok: false, message: "Adjunto inexistente" };
  await prisma.venueAttachment.delete({ where: { id } });
  try {
    await unlink(getStoragePath(att.storedName));
  } catch (e) {
    console.warn("[attachments] failed to unlink", att.storedName, e);
  }
  revalidatePath(`/venues/${att.venueId}`);
  return { ok: true };
}

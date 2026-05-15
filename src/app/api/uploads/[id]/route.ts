import { readFile, stat } from "node:fs/promises";
import { NextRequest } from "next/server";

import { prisma } from "@/server/db/prisma";
import { auth } from "@/server/auth/auth";
import { getStoragePath } from "@/lib/uploads";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { id } = await ctx.params;
  const att = await prisma.venueAttachment.findUnique({ where: { id } });
  if (!att) return new Response("Not found", { status: 404 });

  const filePath = getStoragePath(att.storedName);
  try {
    await stat(filePath);
  } catch {
    return new Response("File missing on disk", { status: 410 });
  }
  const buf = await readFile(filePath);
  const url = new URL(req.url);
  const download = url.searchParams.get("dl") === "1";

  const disposition = download
    ? `attachment; filename="${encodeURIComponent(att.filename)}"`
    : `inline; filename="${encodeURIComponent(att.filename)}"`;

  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": att.mimeType || "application/octet-stream",
      "Content-Length": String(buf.length),
      "Content-Disposition": disposition,
      "Cache-Control": "private, no-store",
    },
  });
}

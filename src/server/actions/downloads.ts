"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { assertAdmin, assertUser } from "@/server/auth/session";
import { downloadRecordSchema, type DownloadRecordInput } from "@/lib/zod-schemas/download";
import type { ActionResult } from "./venues";

function toFieldErrors(error: unknown): Record<string, string[]> {
  if (error && typeof error === "object" && "flatten" in error) {
    const flat = (error as { flatten: () => { fieldErrors: Record<string, string[]> } }).flatten();
    return flat.fieldErrors;
  }
  return {};
}

async function resolveDefaults() {
  const settings = await prisma.appSetting.findMany({
    where: { key: { in: ["default_price_per_download", "default_revenue_share_pct"] } },
  });
  const map = new Map(settings.map((s) => [s.key, s.value]));
  return {
    defaultPrice: map.get("default_price_per_download") ?? "0",
    defaultShare: map.get("default_revenue_share_pct") ?? "100",
  };
}

export async function createDownloadAction(
  venueId: string,
  input: DownloadRecordInput,
): Promise<ActionResult> {
  await assertAdmin();
  const parsed = downloadRecordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Datos inválidos", fieldErrors: toFieldErrors(parsed.error) };
  }
  const v = parsed.data;
  const venue = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!venue) return { ok: false, message: "Cancha inexistente" };

  const { defaultPrice, defaultShare } = await resolveDefaults();
  const unitPrice =
    v.unitPrice ?? venue.pricePerDownload?.toString() ?? defaultPrice;
  const sharePct =
    v.revenueSharePct ?? venue.revenueSharePct?.toString() ?? defaultShare;

  try {
    await prisma.downloadRecord.create({
      data: {
        venueId,
        year: v.year,
        month: v.month,
        downloads: v.downloads,
        unitPrice: unitPrice ? new Prisma.Decimal(unitPrice) : null,
        revenueSharePct: sharePct ? new Prisma.Decimal(sharePct) : null,
        notes: v.notes ?? null,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Ya existe un registro para ese mes." };
    }
    throw e;
  }

  revalidatePath(`/venues/${venueId}`);
  revalidatePath("/downloads");
  revalidatePath("/roi");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateDownloadAction(id: string, input: DownloadRecordInput): Promise<ActionResult> {
  await assertAdmin();
  const parsed = downloadRecordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Datos inválidos", fieldErrors: toFieldErrors(parsed.error) };
  }
  const v = parsed.data;
  const rec = await prisma.downloadRecord.update({
    where: { id },
    data: {
      year: v.year,
      month: v.month,
      downloads: v.downloads,
      unitPrice: v.unitPrice ? new Prisma.Decimal(v.unitPrice) : null,
      revenueSharePct: v.revenueSharePct ? new Prisma.Decimal(v.revenueSharePct) : null,
      notes: v.notes ?? null,
    },
  });
  revalidatePath(`/venues/${rec.venueId}`);
  revalidatePath("/downloads");
  revalidatePath("/roi");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteDownloadAction(id: string): Promise<ActionResult> {
  await assertAdmin();
  const rec = await prisma.downloadRecord.delete({ where: { id } });
  revalidatePath(`/venues/${rec.venueId}`);
  revalidatePath("/downloads");
  revalidatePath("/roi");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function listAllDownloads() {
  await assertUser();
  return prisma.downloadRecord.findMany({
    include: { venue: { include: { sport: true } } },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
}

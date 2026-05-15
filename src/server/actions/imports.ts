"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { assertAdmin } from "@/server/auth/session";
import { parseXlsxBuffer, type ImportPreview } from "@/server/services/import-xlsx";
import { VENUE_STATUSES, venueFormSchema } from "@/lib/zod-schemas/venue";
import { downloadRecordSchema } from "@/lib/zod-schemas/download";
import type { ActionResult } from "./venues";

// ---------- VENUES ----------

interface VenueImportRow {
  name: string;
  address: string;
  city: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  sportName: string;
  status: string;
  ownerName: string | null;
  ownerPhone: string | null;
  ownerEmail: string | null;
  notes: string | null;
}

function normStatus(v: unknown): string {
  if (!v) return "PROSPECT";
  const s = String(v).trim().toUpperCase();
  const map: Record<string, string> = {
    PROSPECTO: "PROSPECT",
    PROSPECT: "PROSPECT",
    INSTALADA: "INSTALLED",
    INSTALLED: "INSTALLED",
    ACTIVA: "ACTIVE",
    ACTIVE: "ACTIVE",
    PAUSADA: "PAUSED",
    PAUSED: "PAUSED",
    CANCELADA: "CANCELLED",
    CANCELLED: "CANCELLED",
  };
  return map[s] ?? "PROSPECT";
}

export async function previewVenuesImport(formData: FormData): Promise<ImportPreview<VenueImportRow>> {
  await assertAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: [], errors: [{ row: 0, message: "Archivo inválido" }], headersFound: [] };
  }
  const buf = Buffer.from(await file.arrayBuffer());
  return parseXlsxBuffer<VenueImportRow>(
    buf,
    [
      { key: "name", aliases: ["nombre", "name"], required: true },
      { key: "address", aliases: ["direccion", "dirección", "address"], required: true },
      { key: "city", aliases: ["ciudad", "city"] },
      { key: "country", aliases: ["pais", "país", "country"] },
      { key: "latitude", aliases: ["latitud", "lat", "latitude"], required: true },
      { key: "longitude", aliases: ["longitud", "lng", "long", "longitude"], required: true },
      { key: "sportName", aliases: ["deporte", "sport"], required: true },
      { key: "status", aliases: ["estado", "status"] },
      { key: "ownerName", aliases: ["dueno", "dueño", "owner", "contacto"] },
      { key: "ownerPhone", aliases: ["telefono", "teléfono", "phone"] },
      { key: "ownerEmail", aliases: ["email", "mail"] },
      { key: "notes", aliases: ["notas", "notes"] },
    ],
    (row) => {
      try {
        const lat = parseFloat(String(row.latitude));
        const lng = parseFloat(String(row.longitude));
        if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
          return { ok: false, error: "Latitud inválida" };
        }
        if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
          return { ok: false, error: "Longitud inválida" };
        }
        const name = String(row.name ?? "").trim();
        const address = String(row.address ?? "").trim();
        const sportName = String(row.sportName ?? "").trim();
        if (!name) return { ok: false, error: "Nombre requerido" };
        if (!address) return { ok: false, error: "Dirección requerida" };
        if (!sportName) return { ok: false, error: "Deporte requerido" };
        return {
          ok: true,
          data: {
            name,
            address,
            city: row.city ? String(row.city).trim() : null,
            country: row.country ? String(row.country).trim() : null,
            latitude: lat,
            longitude: lng,
            sportName,
            status: normStatus(row.status),
            ownerName: row.ownerName ? String(row.ownerName).trim() : null,
            ownerPhone: row.ownerPhone ? String(row.ownerPhone).trim() : null,
            ownerEmail: row.ownerEmail ? String(row.ownerEmail).trim() : null,
            notes: row.notes ? String(row.notes) : null,
          },
        };
      } catch (e) {
        return { ok: false, error: (e as Error).message };
      }
    },
  );
}

export async function commitVenuesImport(
  rows: VenueImportRow[],
): Promise<ActionResult<{ inserted: number; skippedMissingSport: number }>> {
  const user = await assertAdmin();
  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, message: "Sin filas para importar" };
  }

  const sportNames = Array.from(new Set(rows.map((r) => r.sportName.toLowerCase())));
  const sports = await prisma.sport.findMany({
    where: { name: { in: sportNames, mode: "insensitive" } },
  });
  const sportByName = new Map(sports.map((s) => [s.name.toLowerCase(), s]));

  let inserted = 0;
  let skipped = 0;
  for (const r of rows) {
    const sport = sportByName.get(r.sportName.toLowerCase());
    if (!sport) {
      skipped++;
      continue;
    }
    // Validate with main schema before insert
    const v = venueFormSchema.safeParse({
      name: r.name,
      address: r.address,
      city: r.city ?? "",
      country: r.country ?? "",
      latitude: r.latitude,
      longitude: r.longitude,
      sportId: sport.id,
      status: VENUE_STATUSES.includes(r.status as (typeof VENUE_STATUSES)[number])
        ? (r.status as (typeof VENUE_STATUSES)[number])
        : "PROSPECT",
      ownerName: r.ownerName ?? "",
      ownerPhone: r.ownerPhone ?? "",
      ownerEmail: r.ownerEmail ?? "",
      notes: r.notes ?? "",
      pricePerDownload: "",
      revenueSharePct: "",
      currency: "USD",
    });
    if (!v.success) {
      skipped++;
      continue;
    }
    await prisma.venue.create({
      data: {
        name: v.data.name,
        address: v.data.address,
        city: v.data.city ?? null,
        country: v.data.country ?? null,
        latitude: v.data.latitude,
        longitude: v.data.longitude,
        sportId: v.data.sportId,
        status: v.data.status,
        ownerName: v.data.ownerName ?? null,
        ownerPhone: v.data.ownerPhone ?? null,
        ownerEmail: v.data.ownerEmail ?? null,
        notes: v.data.notes ?? null,
        currency: v.data.currency,
        createdById: user.id,
      },
    });
    inserted++;
  }

  revalidatePath("/venues");
  revalidatePath("/map");
  return { ok: true, data: { inserted, skippedMissingSport: skipped } };
}

// ---------- DOWNLOADS ----------

interface DownloadImportRow {
  venueName: string;
  year: number;
  month: number;
  downloads: number;
  unitPrice: number | null;
  revenueSharePct: number | null;
  notes: string | null;
}

function normMonth(v: unknown): number | null {
  if (v == null) return null;
  const s = String(v).trim().toLowerCase();
  if (/^\d+$/.test(s)) {
    const n = parseInt(s, 10);
    return n >= 1 && n <= 12 ? n : null;
  }
  const map: Record<string, number> = {
    enero: 1,
    febrero: 2,
    marzo: 3,
    abril: 4,
    mayo: 5,
    junio: 6,
    julio: 7,
    agosto: 8,
    septiembre: 9,
    octubre: 10,
    noviembre: 11,
    diciembre: 12,
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12,
  };
  return map[s] ?? null;
}

export async function previewDownloadsImport(
  formData: FormData,
): Promise<ImportPreview<DownloadImportRow>> {
  await assertAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: [], errors: [{ row: 0, message: "Archivo inválido" }], headersFound: [] };
  }
  const buf = Buffer.from(await file.arrayBuffer());
  return parseXlsxBuffer<DownloadImportRow>(
    buf,
    [
      { key: "venueName", aliases: ["cancha", "venue", "nombre"], required: true },
      { key: "year", aliases: ["ano", "año", "year"], required: true },
      { key: "month", aliases: ["mes", "month"], required: true },
      { key: "downloads", aliases: ["descargas", "downloads", "count"], required: true },
      { key: "unitPrice", aliases: ["precio", "price", "unitprice", "unit_price"] },
      { key: "revenueSharePct", aliases: ["share", "revenue_share", "revenuesharepct", "share_pct"] },
      { key: "notes", aliases: ["notas", "notes"] },
    ],
    (row) => {
      const venueName = String(row.venueName ?? "").trim();
      const year = parseInt(String(row.year), 10);
      const month = normMonth(row.month);
      const downloads = parseInt(String(row.downloads), 10);
      if (!venueName) return { ok: false, error: "Cancha requerida" };
      if (!Number.isInteger(year) || year < 2000 || year > 2100) return { ok: false, error: "Año inválido" };
      if (!month) return { ok: false, error: "Mes inválido" };
      if (!Number.isInteger(downloads) || downloads < 0) return { ok: false, error: "Descargas inválidas" };
      const price = row.unitPrice == null || row.unitPrice === "" ? null : parseFloat(String(row.unitPrice));
      const share =
        row.revenueSharePct == null || row.revenueSharePct === ""
          ? null
          : parseFloat(String(row.revenueSharePct));
      return {
        ok: true,
        data: {
          venueName,
          year,
          month,
          downloads,
          unitPrice: price != null && !isNaN(price) ? price : null,
          revenueSharePct: share != null && !isNaN(share) ? share : null,
          notes: row.notes ? String(row.notes) : null,
        },
      };
    },
  );
}

export async function commitDownloadsImport(
  rows: DownloadImportRow[],
): Promise<ActionResult<{ inserted: number; updated: number; skipped: number }>> {
  await assertAdmin();
  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, message: "Sin filas para importar" };
  }
  const venueNames = Array.from(new Set(rows.map((r) => r.venueName.toLowerCase())));
  const venues = await prisma.venue.findMany({
    where: { name: { in: venueNames, mode: "insensitive" } },
  });
  const byName = new Map(venues.map((v) => [v.name.toLowerCase(), v]));

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const r of rows) {
    const venue = byName.get(r.venueName.toLowerCase());
    if (!venue) {
      skipped++;
      continue;
    }
    const parsed = downloadRecordSchema.safeParse({
      year: r.year,
      month: r.month,
      downloads: r.downloads,
      unitPrice: r.unitPrice ?? "",
      revenueSharePct: r.revenueSharePct ?? "",
      notes: r.notes ?? "",
    });
    if (!parsed.success) {
      skipped++;
      continue;
    }
    const data = {
      year: parsed.data.year,
      month: parsed.data.month,
      downloads: parsed.data.downloads,
      unitPrice: parsed.data.unitPrice ? new Prisma.Decimal(parsed.data.unitPrice) : venue.pricePerDownload,
      revenueSharePct: parsed.data.revenueSharePct
        ? new Prisma.Decimal(parsed.data.revenueSharePct)
        : venue.revenueSharePct,
      notes: parsed.data.notes ?? null,
    };

    const existing = await prisma.downloadRecord.findUnique({
      where: { venueId_year_month: { venueId: venue.id, year: data.year, month: data.month } },
    });
    if (existing) {
      await prisma.downloadRecord.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await prisma.downloadRecord.create({ data: { ...data, venueId: venue.id } });
      inserted++;
    }
  }

  revalidatePath("/downloads");
  revalidatePath("/dashboard");
  revalidatePath("/roi");
  return { ok: true, data: { inserted, updated, skipped } };
}

export type { VenueImportRow, DownloadImportRow };

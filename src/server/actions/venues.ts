"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { assertAdmin, assertUser } from "@/server/auth/session";
import {
  venueFilterSchema,
  venueFormSchema,
  type VenueFilter,
  type VenueFormInput,
} from "@/lib/zod-schemas/venue";

export interface ActionResult<T = unknown> {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  data?: T;
}

function toFieldErrors(error: unknown): Record<string, string[]> {
  if (error && typeof error === "object" && "flatten" in error) {
    const flat = (error as { flatten: () => { fieldErrors: Record<string, string[]> } }).flatten();
    return flat.fieldErrors;
  }
  return {};
}

export async function listVenues(filter: VenueFilter = {}) {
  await assertUser();
  const parsed = venueFilterSchema.parse(filter);

  const where: Prisma.VenueWhereInput = {};
  if (parsed.q) {
    where.OR = [
      { name: { contains: parsed.q, mode: "insensitive" } },
      { address: { contains: parsed.q, mode: "insensitive" } },
      { city: { contains: parsed.q, mode: "insensitive" } },
      { ownerName: { contains: parsed.q, mode: "insensitive" } },
    ];
  }
  if (parsed.status) where.status = parsed.status;
  if (parsed.sportId) where.sportId = parsed.sportId;
  if (parsed.cloudActive) where.cloudActive = parsed.cloudActive === "true";

  return prisma.venue.findMany({
    where,
    include: { sport: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getVenue(id: string) {
  await assertUser();
  return prisma.venue.findUnique({
    where: { id },
    include: {
      sport: true,
      costs: { orderBy: { incurredAt: "desc" } },
      downloads: { orderBy: [{ year: "desc" }, { month: "desc" }] },
      cloudLogs: { orderBy: { changedAt: "desc" }, take: 50, include: { changedBy: true } },
      attachments: { orderBy: { uploadedAt: "desc" } },
      createdBy: true,
    },
  });
}

export async function createVenueAction(input: VenueFormInput): Promise<ActionResult<{ id: string }>> {
  const user = await assertAdmin();
  const parsed = venueFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Datos inválidos", fieldErrors: toFieldErrors(parsed.error) };
  }
  const v = parsed.data;
  const created = await prisma.venue.create({
    data: {
      name: v.name,
      address: v.address,
      city: v.city ?? null,
      country: v.country ?? null,
      latitude: v.latitude,
      longitude: v.longitude,
      sportId: v.sportId,
      status: v.status,
      ownerName: v.ownerName ?? null,
      ownerPhone: v.ownerPhone ?? null,
      ownerEmail: v.ownerEmail ?? null,
      notes: v.notes ?? null,
      pricePerDownload: v.pricePerDownload ? new Prisma.Decimal(v.pricePerDownload) : null,
      revenueSharePct: v.revenueSharePct ? new Prisma.Decimal(v.revenueSharePct) : null,
      currency: v.currency,
      createdById: user.id,
    },
  });
  revalidatePath("/venues");
  revalidatePath("/map");
  return { ok: true, data: { id: created.id } };
}

export async function updateVenueAction(
  id: string,
  input: VenueFormInput,
): Promise<ActionResult> {
  await assertAdmin();
  const parsed = venueFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Datos inválidos", fieldErrors: toFieldErrors(parsed.error) };
  }
  const v = parsed.data;
  await prisma.venue.update({
    where: { id },
    data: {
      name: v.name,
      address: v.address,
      city: v.city ?? null,
      country: v.country ?? null,
      latitude: v.latitude,
      longitude: v.longitude,
      sportId: v.sportId,
      status: v.status,
      ownerName: v.ownerName ?? null,
      ownerPhone: v.ownerPhone ?? null,
      ownerEmail: v.ownerEmail ?? null,
      notes: v.notes ?? null,
      pricePerDownload: v.pricePerDownload ? new Prisma.Decimal(v.pricePerDownload) : null,
      revenueSharePct: v.revenueSharePct ? new Prisma.Decimal(v.revenueSharePct) : null,
      currency: v.currency,
    },
  });
  revalidatePath("/venues");
  revalidatePath(`/venues/${id}`);
  revalidatePath("/map");
  return { ok: true };
}

export async function deleteVenueAction(id: string): Promise<ActionResult> {
  await assertAdmin();
  await prisma.venue.delete({ where: { id } });
  revalidatePath("/venues");
  revalidatePath("/map");
  return { ok: true };
}

export async function toggleCloudActiveAction(
  id: string,
  active: boolean,
  reason?: string,
): Promise<ActionResult> {
  const user = await assertUser();
  await prisma.$transaction([
    prisma.venue.update({
      where: { id },
      data: {
        cloudActive: active,
        cloudActivatedAt: active ? new Date() : null,
      },
    }),
    prisma.cloudAccessLog.create({
      data: {
        venueId: id,
        active,
        changedById: user.id,
        reason: reason ?? null,
      },
    }),
  ]);
  revalidatePath("/venues");
  revalidatePath(`/venues/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteVenueAndRedirect(id: string) {
  const result = await deleteVenueAction(id);
  if (!result.ok) return result;
  redirect("/venues");
}

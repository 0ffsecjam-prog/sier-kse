"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { assertAdmin } from "@/server/auth/session";
import { installationCostSchema, type InstallationCostInput } from "@/lib/zod-schemas/cost";
import type { ActionResult } from "./venues";

function toFieldErrors(error: unknown): Record<string, string[]> {
  if (error && typeof error === "object" && "flatten" in error) {
    const flat = (error as { flatten: () => { fieldErrors: Record<string, string[]> } }).flatten();
    return flat.fieldErrors;
  }
  return {};
}

export async function createCostAction(
  venueId: string,
  input: InstallationCostInput,
): Promise<ActionResult> {
  await assertAdmin();
  const parsed = installationCostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Datos inválidos", fieldErrors: toFieldErrors(parsed.error) };
  }
  const v = parsed.data;
  await prisma.installationCost.create({
    data: {
      venueId,
      category: v.category,
      description: v.description,
      amount: new Prisma.Decimal(v.amount),
      currency: v.currency,
      incurredAt: v.incurredAt,
    },
  });
  revalidatePath(`/venues/${venueId}`);
  revalidatePath("/costs");
  revalidatePath("/roi");
  return { ok: true };
}

export async function updateCostAction(id: string, input: InstallationCostInput): Promise<ActionResult> {
  await assertAdmin();
  const parsed = installationCostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Datos inválidos", fieldErrors: toFieldErrors(parsed.error) };
  }
  const v = parsed.data;
  const cost = await prisma.installationCost.update({
    where: { id },
    data: {
      category: v.category,
      description: v.description,
      amount: new Prisma.Decimal(v.amount),
      currency: v.currency,
      incurredAt: v.incurredAt,
    },
  });
  revalidatePath(`/venues/${cost.venueId}`);
  revalidatePath("/costs");
  revalidatePath("/roi");
  return { ok: true };
}

export async function deleteCostAction(id: string): Promise<ActionResult> {
  await assertAdmin();
  const cost = await prisma.installationCost.delete({ where: { id } });
  revalidatePath(`/venues/${cost.venueId}`);
  revalidatePath("/costs");
  revalidatePath("/roi");
  return { ok: true };
}

export async function listAllCosts() {
  return prisma.installationCost.findMany({
    include: { venue: { include: { sport: true } } },
    orderBy: { incurredAt: "desc" },
  });
}

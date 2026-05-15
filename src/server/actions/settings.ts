"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/server/db/prisma";
import { assertAdmin } from "@/server/auth/session";
import { appSettingSchema } from "@/lib/zod-schemas/admin";
import type { ActionResult } from "./venues";

const KNOWN_KEYS = [
  "default_price_per_download",
  "default_revenue_share_pct",
  "default_currency",
  "company_name",
] as const;

export async function listSettings() {
  await assertAdmin();
  const rows = await prisma.appSetting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return KNOWN_KEYS.map((k) => ({ key: k, value: map.get(k) ?? "" }));
}

export async function upsertSettingsAction(
  entries: { key: string; value: string }[],
): Promise<ActionResult> {
  await assertAdmin();
  const validated: { key: string; value: string }[] = [];
  for (const e of entries) {
    const parsed = appSettingSchema.safeParse(e);
    if (parsed.success) validated.push(parsed.data);
  }
  await prisma.$transaction(
    validated.map((e) =>
      prisma.appSetting.upsert({
        where: { key: e.key },
        update: { value: e.value },
        create: { key: e.key, value: e.value },
      }),
    ),
  );
  revalidatePath("/admin/settings");
  revalidatePath("/roi");
  revalidatePath("/dashboard");
  return { ok: true };
}

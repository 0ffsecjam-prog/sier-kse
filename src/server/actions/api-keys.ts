"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { assertAdmin } from "@/server/auth/session";
import { encrypt, decrypt, lastFour } from "@/lib/crypto";
import {
  apiKeyCreateSchema,
  apiKeyUpdateSchema,
  type ApiKeyCreateInput,
  type ApiKeyUpdateInput,
} from "@/lib/zod-schemas/admin";
import type { ActionResult } from "./venues";

function toFieldErrors(error: unknown): Record<string, string[]> {
  if (error && typeof error === "object" && "flatten" in error) {
    const flat = (error as { flatten: () => { fieldErrors: Record<string, string[]> } }).flatten();
    return flat.fieldErrors;
  }
  return {};
}

export async function createApiKeyAction(input: ApiKeyCreateInput): Promise<ActionResult<{ id: string }>> {
  const user = await assertAdmin();
  const parsed = apiKeyCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Datos inválidos", fieldErrors: toFieldErrors(parsed.error) };
  }
  const v = parsed.data;
  const enc = encrypt(v.secret);
  try {
    const created = await prisma.apiKey.create({
      data: {
        provider: v.provider.trim(),
        label: v.label.trim(),
        ciphertext: enc.ciphertext,
        iv: enc.iv,
        authTag: enc.authTag,
        lastFour: lastFour(v.secret),
        active: v.active,
        createdById: user.id,
      },
    });
    revalidatePath("/admin/api-keys");
    return { ok: true, data: { id: created.id } };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Ya existe una key con ese proveedor + etiqueta." };
    }
    throw e;
  }
}

export async function updateApiKeyAction(id: string, input: ApiKeyUpdateInput): Promise<ActionResult> {
  await assertAdmin();
  const parsed = apiKeyUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Datos inválidos", fieldErrors: toFieldErrors(parsed.error) };
  }
  const v = parsed.data;
  const data: {
    label: string;
    active: boolean;
    ciphertext?: string;
    iv?: string;
    authTag?: string;
    lastFour?: string;
    rotatedAt?: Date;
  } = {
    label: v.label.trim(),
    active: v.active,
  };
  if (v.secret && v.secret.length >= 4) {
    const enc = encrypt(v.secret);
    data.ciphertext = enc.ciphertext;
    data.iv = enc.iv;
    data.authTag = enc.authTag;
    data.lastFour = lastFour(v.secret);
    data.rotatedAt = new Date();
  }
  await prisma.apiKey.update({ where: { id }, data });
  revalidatePath("/admin/api-keys");
  return { ok: true };
}

export async function deleteApiKeyAction(id: string): Promise<ActionResult> {
  await assertAdmin();
  await prisma.apiKey.delete({ where: { id } });
  revalidatePath("/admin/api-keys");
  return { ok: true };
}

export async function listApiKeys() {
  await assertAdmin();
  return prisma.apiKey.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      provider: true,
      label: true,
      lastFour: true,
      active: true,
      createdAt: true,
      rotatedAt: true,
    },
  });
}

// Server-only helper to fetch & decrypt a key for use in code paths.
export async function resolveApiKey(provider: string, label?: string): Promise<string | null> {
  const key = await prisma.apiKey.findFirst({
    where: { provider, active: true, ...(label ? { label } : {}) },
    orderBy: { createdAt: "desc" },
  });
  if (!key) return null;
  return decrypt({ ciphertext: key.ciphertext, iv: key.iv, authTag: key.authTag });
}

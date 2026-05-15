"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

import { prisma } from "@/server/db/prisma";
import { assertAdmin } from "@/server/auth/session";
import {
  userCreateSchema,
  userUpdateSchema,
  type UserCreateInput,
  type UserUpdateInput,
} from "@/lib/zod-schemas/admin";
import type { ActionResult } from "./venues";

function toFieldErrors(error: unknown): Record<string, string[]> {
  if (error && typeof error === "object" && "flatten" in error) {
    const flat = (error as { flatten: () => { fieldErrors: Record<string, string[]> } }).flatten();
    return flat.fieldErrors;
  }
  return {};
}

export async function createUserAction(input: UserCreateInput): Promise<ActionResult> {
  await assertAdmin();
  const parsed = userCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Datos inválidos", fieldErrors: toFieldErrors(parsed.error) };
  }
  const v = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: v.email } });
  if (existing) return { ok: false, message: "El email ya está registrado." };
  const hash = await bcrypt.hash(v.password, 10);
  await prisma.user.create({
    data: {
      email: v.email,
      name: v.name,
      passwordHash: hash,
      role: v.role,
      active: v.active,
    },
  });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function updateUserAction(id: string, input: UserUpdateInput): Promise<ActionResult> {
  await assertAdmin();
  const parsed = userUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Datos inválidos", fieldErrors: toFieldErrors(parsed.error) };
  }
  const v = parsed.data;
  const data: {
    name: string;
    role: "ADMIN" | "VIEWER";
    active: boolean;
    passwordHash?: string;
  } = {
    name: v.name,
    role: v.role,
    active: v.active,
  };
  if (v.password) {
    data.passwordHash = await bcrypt.hash(v.password, 10);
  }
  await prisma.user.update({ where: { id }, data });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function deleteUserAction(id: string): Promise<ActionResult> {
  const admin = await assertAdmin();
  if (admin.id === id) {
    return { ok: false, message: "No podés eliminar tu propio usuario." };
  }
  // Soft block: only allow delete if user has no related rows
  const relatedVenues = await prisma.venue.count({ where: { createdById: id } });
  const relatedAttachments = await prisma.venueAttachment.count({ where: { uploadedById: id } });
  const relatedLogs = await prisma.cloudAccessLog.count({ where: { changedById: id } });
  if (relatedVenues + relatedAttachments + relatedLogs > 0) {
    return {
      ok: false,
      message: "El usuario tiene datos asociados. Marcalo como inactivo en vez de eliminar.",
    };
  }
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function listUsers() {
  await assertAdmin();
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });
}

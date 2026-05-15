import { z } from "zod";

export const userCreateSchema = z.object({
  email: z.string().email("Email inválido").transform((s) => s.trim().toLowerCase()),
  name: z.string().min(1, "Nombre requerido").max(120),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  role: z.enum(["ADMIN", "VIEWER"]),
  active: z.boolean().default(true),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1).max(120),
  role: z.enum(["ADMIN", "VIEWER"]),
  active: z.boolean(),
  password: z.string().optional().refine((v) => !v || v.length >= 8, { message: "Mínimo 8 caracteres" }),
});

export type UserCreateInput = z.input<typeof userCreateSchema>;
export type UserUpdateInput = z.input<typeof userUpdateSchema>;

export const apiKeyCreateSchema = z.object({
  provider: z.string().min(1, "Proveedor requerido").max(64),
  label: z.string().min(1, "Etiqueta requerida").max(80),
  secret: z.string().min(4, "Secret muy corto"),
  active: z.boolean().default(true),
});

export const apiKeyUpdateSchema = z.object({
  label: z.string().min(1).max(80),
  active: z.boolean(),
  secret: z.string().optional(),
});

export type ApiKeyCreateInput = z.input<typeof apiKeyCreateSchema>;
export type ApiKeyUpdateInput = z.input<typeof apiKeyUpdateSchema>;

export const appSettingSchema = z.object({
  key: z.string().min(1).max(120),
  value: z.string().max(500),
});

export type AppSettingInput = z.input<typeof appSettingSchema>;

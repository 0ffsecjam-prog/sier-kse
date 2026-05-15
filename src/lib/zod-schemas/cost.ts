import { z } from "zod";

export const COST_CATEGORIES = [
  "CAMERA",
  "LABOR",
  "TRAVEL",
  "HARDWARE",
  "CONNECTIVITY",
  "OTHER",
] as const;

export const costCategoryEnum = z.enum(COST_CATEGORIES);
export type CostCategory = z.infer<typeof costCategoryEnum>;

const decimalStr = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === "number" ? v.toString() : v.trim()))
  .refine((v) => v !== "" && !isNaN(parseFloat(v)) && parseFloat(v) >= 0, {
    message: "Monto inválido",
  });

const dateInput = z
  .union([z.string(), z.date()])
  .transform((v) => (v instanceof Date ? v : new Date(v)))
  .refine((d) => d instanceof Date && !isNaN(d.getTime()), { message: "Fecha inválida" });

export const installationCostSchema = z.object({
  category: costCategoryEnum,
  description: z.string().min(1, "Descripción requerida").max(240),
  amount: decimalStr,
  currency: z.string().min(3).max(8).default("USD"),
  incurredAt: dateInput,
});

export type InstallationCostInput = z.input<typeof installationCostSchema>;

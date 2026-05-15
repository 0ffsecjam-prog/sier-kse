import { z } from "zod";

const intPositive = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === "string" ? parseInt(v, 10) : v))
  .refine((v) => Number.isInteger(v) && v >= 0, { message: "Entero >= 0" });

const yearCoerce = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === "string" ? parseInt(v, 10) : v))
  .refine((v) => Number.isInteger(v) && v >= 2000 && v <= 2100, { message: "Año inválido" });

const monthCoerce = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === "string" ? parseInt(v, 10) : v))
  .refine((v) => Number.isInteger(v) && v >= 1 && v <= 12, { message: "Mes 1-12" });

const decimalOpt = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === "number" ? v.toString() : v.trim()))
  .refine((v) => v === "" || !isNaN(parseFloat(v)), { message: "Número inválido" })
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

export const downloadRecordSchema = z.object({
  year: yearCoerce,
  month: monthCoerce,
  downloads: intPositive,
  unitPrice: decimalOpt,
  revenueSharePct: decimalOpt,
  notes: z.string().max(500).optional().nullable(),
});

export type DownloadRecordInput = z.input<typeof downloadRecordSchema>;

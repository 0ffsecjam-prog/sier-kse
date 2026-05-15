import { z } from "zod";

export const VENUE_STATUSES = [
  "PROSPECT",
  "INSTALLED",
  "ACTIVE",
  "PAUSED",
  "CANCELLED",
] as const;

export const venueStatusEnum = z.enum(VENUE_STATUSES);
export type VenueStatus = z.infer<typeof venueStatusEnum>;

const decimalString = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === "number" ? v.toString() : v))
  .refine((v) => v === "" || !isNaN(parseFloat(v)), { message: "Número inválido" })
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

const intCoerce = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === "string" ? parseInt(v, 10) : v))
  .refine((v) => Number.isInteger(v) && v > 0, { message: "Seleccioná un deporte" });

const latitudeSchema = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === "string" ? parseFloat(v) : v))
  .refine((v) => !isNaN(v) && v >= -90 && v <= 90, { message: "Latitud entre -90 y 90" });

const longitudeSchema = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === "string" ? parseFloat(v) : v))
  .refine((v) => !isNaN(v) && v >= -180 && v <= 180, { message: "Longitud entre -180 y 180" });

export const venueFormSchema = z.object({
  name: z.string().min(2, "Nombre muy corto").max(120),
  address: z.string().min(2, "Dirección muy corta").max(240),
  city: z.string().max(80).optional().nullable(),
  country: z.string().max(80).optional().nullable(),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  sportId: intCoerce,
  status: venueStatusEnum.default("PROSPECT"),
  ownerName: z.string().max(120).optional().nullable(),
  ownerPhone: z.string().max(40).optional().nullable(),
  ownerEmail: z
    .string()
    .max(120)
    .optional()
    .nullable()
    .refine((v) => !v || z.string().email().safeParse(v).success, { message: "Email inválido" }),
  notes: z.string().max(2000).optional().nullable(),
  pricePerDownload: decimalString,
  revenueSharePct: decimalString,
  currency: z.string().min(3).max(8).default("USD"),
});

export type VenueFormInput = z.input<typeof venueFormSchema>;
export type VenueFormValues = z.output<typeof venueFormSchema>;

export const venueFilterSchema = z.object({
  q: z.string().optional(),
  status: venueStatusEnum.optional(),
  sportId: z.coerce.number().int().positive().optional(),
  cloudActive: z.enum(["true", "false"]).optional(),
});
export type VenueFilter = z.infer<typeof venueFilterSchema>;

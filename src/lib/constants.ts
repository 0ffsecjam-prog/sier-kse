import type { VenueStatus } from "@/lib/zod-schemas/venue";

export const VENUE_STATUS_LABELS: Record<VenueStatus, string> = {
  PROSPECT: "Prospecto",
  INSTALLED: "Instalada",
  ACTIVE: "Activa",
  PAUSED: "Pausada",
  CANCELLED: "Cancelada",
};

export const VENUE_STATUS_COLORS: Record<VenueStatus, string> = {
  PROSPECT: "#94a3b8", // slate-400
  INSTALLED: "#0ea5e9", // sky-500
  ACTIVE: "#10b981", // emerald-500
  PAUSED: "#f59e0b", // amber-500
  CANCELLED: "#ef4444", // red-500
};

export const COST_CATEGORY_LABELS: Record<string, string> = {
  CAMERA: "Cámara",
  LABOR: "Mano de obra",
  TRAVEL: "Viaje",
  HARDWARE: "Hardware",
  CONNECTIVITY: "Conectividad",
  OTHER: "Otro",
};

export const ATTACHMENT_KIND_LABELS: Record<string, string> = {
  CONTRACT: "Contrato",
  PHOTO: "Foto",
  INVOICE: "Factura",
  OTHER: "Otro",
};

export const MONTH_LABELS = [
  "",
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// Centro de Buenos Aires por default
export const DEFAULT_MAP_CENTER: [number, number] = [-34.6037, -58.3816];
export const DEFAULT_MAP_ZOOM = 12;

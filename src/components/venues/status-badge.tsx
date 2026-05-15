import { Badge } from "@/components/ui/badge";
import { VENUE_STATUS_LABELS } from "@/lib/constants";
import type { VenueStatus } from "@/lib/zod-schemas/venue";

const VARIANTS: Record<VenueStatus, "default" | "secondary" | "success" | "warning" | "destructive" | "info"> = {
  PROSPECT: "secondary",
  INSTALLED: "info",
  ACTIVE: "success",
  PAUSED: "warning",
  CANCELLED: "destructive",
};

export function VenueStatusBadge({ status }: { status: VenueStatus | string }) {
  const s = status as VenueStatus;
  return <Badge variant={VARIANTS[s] ?? "default"}>{VENUE_STATUS_LABELS[s] ?? s}</Badge>;
}

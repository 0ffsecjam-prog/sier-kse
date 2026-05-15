import { Map as MapIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import { PageShell } from "@/components/common/page-shell";
import { VenueMap } from "@/components/map/venue-map-loader";
import { VENUE_STATUS_COLORS, VENUE_STATUS_LABELS } from "@/lib/constants";
import { VENUE_STATUSES } from "@/lib/zod-schemas/venue";
import { listVenues } from "@/server/actions/venues";

export default async function MapPage() {
  const venues = await listVenues();

  return (
    <PageShell title="Mapa" description="Ubicación de las canchas. Click en un pin para ver el detalle.">
      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        {venues.length === 0 ? (
          <EmptyState
            icon={<MapIcon className="h-8 w-8" />}
            title="Sin canchas para mostrar"
            description="Cargá una cancha desde Canchas → Nueva cancha para verla acá."
          />
        ) : (
          <VenueMap
            venues={venues.map((v) => ({
              id: v.id,
              name: v.name,
              status: v.status,
              cloudActive: v.cloudActive,
              latitude: v.latitude,
              longitude: v.longitude,
              sport: v.sport.name,
              city: v.city,
            }))}
            height="72vh"
          />
        )}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Referencias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {VENUE_STATUSES.map((s) => (
              <div key={s} className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ background: VENUE_STATUS_COLORS[s] }}
                />
                <span>{VENUE_STATUS_LABELS[s]}</span>
              </div>
            ))}
            <p className="pt-3 text-xs text-muted-foreground">
              Un punto blanco (•) dentro del pin indica que esa cancha tiene la nube activa.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

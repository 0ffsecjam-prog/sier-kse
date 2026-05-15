"use client";

import dynamic from "next/dynamic";

export const VenueMap = dynamic(() => import("./venue-map").then((m) => m.VenueMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[300px] items-center justify-center rounded-lg border bg-card text-sm text-muted-foreground">
      Cargando mapa...
    </div>
  ),
});

export type { VenueMarker } from "./venue-map";

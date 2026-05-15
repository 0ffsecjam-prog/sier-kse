"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import Link from "next/link";

import "@/app/leaflet.css";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  VENUE_STATUS_COLORS,
  VENUE_STATUS_LABELS,
} from "@/lib/constants";
import type { VenueStatus } from "@/lib/zod-schemas/venue";

export interface VenueMarker {
  id: string;
  name: string;
  status: VenueStatus | string;
  cloudActive: boolean;
  latitude: number;
  longitude: number;
  sport: string;
  city: string | null;
}

interface Props {
  venues: VenueMarker[];
  className?: string;
  height?: string;
  interactive?: boolean;
  selectable?: boolean;
  onLocationChange?: (lat: number, lng: number) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
  marker?: { lat: number; lng: number } | null;
}

function statusColor(s: string) {
  return VENUE_STATUS_COLORS[s as VenueStatus] ?? "#64748b";
}

function makeIcon(color: string, label = "") {
  return L.divIcon({
    className: "",
    html: `<div class="venue-marker" style="background:${color}">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -12],
  });
}

function ClickCatcher({ onChange }: { onChange?: (lat: number, lng: number) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!onChange) return;
    function handler(e: L.LeafletMouseEvent) {
      onChange?.(e.latlng.lat, e.latlng.lng);
    }
    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [map, onChange]);
  return null;
}

function FitToVenues({ venues }: { venues: VenueMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (venues.length === 0) return;
    const bounds = L.latLngBounds(venues.map((v) => [v.latitude, v.longitude] as [number, number]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [map, venues]);
  return null;
}

export function VenueMap({
  venues,
  className,
  height = "70vh",
  interactive = true,
  selectable,
  onLocationChange,
  initialCenter,
  initialZoom,
  marker,
}: Props) {
  const center =
    initialCenter ??
    (venues[0] ? [venues[0].latitude, venues[0].longitude] : DEFAULT_MAP_CENTER);

  const icons = useMemo(() => {
    const cache = new Map<string, L.DivIcon>();
    venues.forEach((v) => {
      const k = v.status;
      if (!cache.has(k)) cache.set(k, makeIcon(statusColor(k), v.cloudActive ? "•" : ""));
    });
    return cache;
  }, [venues]);

  return (
    <div className={className} style={{ height }}>
      <MapContainer
        center={center as [number, number]}
        zoom={initialZoom ?? DEFAULT_MAP_ZOOM}
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {venues.map((v) => (
          <Marker
            key={v.id}
            position={[v.latitude, v.longitude]}
            icon={icons.get(v.status) ?? makeIcon(statusColor(v.status))}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">{v.name}</p>
                <p className="text-xs">
                  {v.sport} · {VENUE_STATUS_LABELS[v.status as VenueStatus] ?? v.status}
                  {v.cloudActive ? " · Cloud activa" : ""}
                </p>
                {v.city && <p className="text-xs">{v.city}</p>}
                <Link href={`/venues/${v.id}`} className="text-xs text-sky-600 hover:underline">
                  Ver detalle →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
        {selectable && marker && (
          <Marker
            position={[marker.lat, marker.lng]}
            icon={makeIcon("#0ea5e9", "+")}
          />
        )}
        {selectable && onLocationChange && <ClickCatcher onChange={onLocationChange} />}
        {!selectable && venues.length > 1 && <FitToVenues venues={venues} />}
      </MapContainer>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VENUE_STATUSES, venueFormSchema, type VenueFormInput } from "@/lib/zod-schemas/venue";
import { VENUE_STATUS_LABELS, DEFAULT_MAP_CENTER } from "@/lib/constants";
import { VenueMap } from "@/components/map/venue-map-loader";
import {
  createVenueAction,
  updateVenueAction,
  type ActionResult,
} from "@/server/actions/venues";

interface SportOption {
  id: number;
  name: string;
}

interface Props {
  sports: SportOption[];
  venueId?: string;
  defaultValues?: Partial<VenueFormInput>;
}

const STATUS_OPTIONS = VENUE_STATUSES.map((s) => ({ value: s, label: VENUE_STATUS_LABELS[s] }));

function LocationPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number | string | undefined;
  lng: number | string | undefined;
  onChange: (lat: number, lng: number) => void;
}) {
  const latN = typeof lat === "string" ? parseFloat(lat) : lat;
  const lngN = typeof lng === "string" ? parseFloat(lng) : lng;
  const valid = typeof latN === "number" && !isNaN(latN) && typeof lngN === "number" && !isNaN(lngN);
  const center: [number, number] = valid ? [latN, lngN] : DEFAULT_MAP_CENTER;
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Ubicación en el mapa</p>
      <p className="text-xs text-muted-foreground">
        Click en el mapa para fijar coordenadas. Si ya tenés lat/lng, el pin se actualiza solo.
      </p>
      <VenueMap
        venues={[]}
        height="320px"
        selectable
        marker={valid ? { lat: latN, lng: lngN } : null}
        initialCenter={center}
        initialZoom={valid ? 14 : undefined}
        onLocationChange={(la, ln) => onChange(parseFloat(la.toFixed(6)), parseFloat(ln.toFixed(6)))}
      />
    </div>
  );
}

export function VenueForm({ sports, venueId, defaultValues }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const form = useForm<VenueFormInput>({
    resolver: zodResolver(venueFormSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      country: "",
      latitude: "" as unknown as number,
      longitude: "" as unknown as number,
      sportId: "" as unknown as number,
      status: "PROSPECT",
      ownerName: "",
      ownerPhone: "",
      ownerEmail: "",
      notes: "",
      pricePerDownload: "",
      revenueSharePct: "",
      currency: "USD",
      ...defaultValues,
    },
  });

  function applyFieldErrors(result: ActionResult) {
    if (result.fieldErrors) {
      for (const [field, msgs] of Object.entries(result.fieldErrors)) {
        if (msgs?.length) {
          form.setError(field as keyof VenueFormInput, { message: msgs[0] });
        }
      }
    }
    setGlobalError(result.message ?? "Hubo un error al guardar.");
  }

  function onSubmit(values: VenueFormInput) {
    setGlobalError(null);
    startTransition(async () => {
      const result = venueId
        ? await updateVenueAction(venueId, values)
        : await createVenueAction(values);
      if (!result.ok) {
        applyFieldErrors(result);
        return;
      }
      toast.success(venueId ? "Cancha actualizada" : "Cancha creada");
      const newId = (result.data as { id?: string } | undefined)?.id ?? venueId;
      if (newId) {
        router.push(`/venues/${newId}`);
      } else {
        router.push("/venues");
      }
      router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Padel Palermo" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sportId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deporte</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(parseInt(v, 10))}
                  value={field.value ? String(field.value) : undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Elegí un deporte" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sports.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input placeholder="Av. Siempre Viva 123" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>País</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitud</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    placeholder="-34.6037"
                    {...field}
                    value={(field.value as number | string | undefined) ?? ""}
                  />
                </FormControl>
                <FormDescription>Decimal entre -90 y 90.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitud</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    placeholder="-58.3816"
                    {...field}
                    value={(field.value as number | string | undefined) ?? ""}
                  />
                </FormControl>
                <FormDescription>Decimal entre -180 y 180.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <LocationPicker
          lat={form.watch("latitude")}
          lng={form.watch("longitude")}
          onChange={(lat, lng) => {
            form.setValue("latitude", lat, { shouldValidate: true });
            form.setValue("longitude", lng, { shouldValidate: true });
          }}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="ownerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dueño / contacto</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ownerPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ownerEmail"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Email del contacto</FormLabel>
                <FormControl>
                  <Input type="email" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="pricePerDownload"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio por descarga</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="(default global)"
                    {...field}
                    value={(field.value as string | undefined) ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="revenueSharePct"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Revenue share (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="(default global)"
                    {...field}
                    value={(field.value as string | undefined) ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? "USD"} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {globalError && <p className="text-sm font-medium text-destructive">{globalError}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {venueId ? "Guardar cambios" : "Crear cancha"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}

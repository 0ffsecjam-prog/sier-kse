"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VENUE_STATUSES } from "@/lib/zod-schemas/venue";
import { VENUE_STATUS_LABELS } from "@/lib/constants";

interface Sport {
  id: number;
  name: string;
}

const ALL = "__all__";

export function VenuesFilters({ sports }: { sports: Sport[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const update = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value && value !== ALL) next.set(key, value);
      else next.delete(key);
      startTransition(() => router.replace(`/venues?${next.toString()}`));
    },
    [params, router],
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, dirección, ciudad..."
          defaultValue={params.get("q") ?? ""}
          onChange={(e) => update("q", e.target.value || null)}
          className="pl-9"
        />
      </div>
      <Select
        defaultValue={params.get("status") ?? ALL}
        onValueChange={(v) => update("status", v === ALL ? null : v)}
      >
        <SelectTrigger className="sm:w-44">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los estados</SelectItem>
          {VENUE_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {VENUE_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        defaultValue={params.get("sportId") ?? ALL}
        onValueChange={(v) => update("sportId", v === ALL ? null : v)}
      >
        <SelectTrigger className="sm:w-44">
          <SelectValue placeholder="Deporte" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los deportes</SelectItem>
          {sports.map((s) => (
            <SelectItem key={s.id} value={String(s.id)}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        defaultValue={params.get("cloudActive") ?? ALL}
        onValueChange={(v) => update("cloudActive", v === ALL ? null : v)}
      >
        <SelectTrigger className="sm:w-40">
          <SelectValue placeholder="Cloud" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todas</SelectItem>
          <SelectItem value="true">En nube</SelectItem>
          <SelectItem value="false">No en nube</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

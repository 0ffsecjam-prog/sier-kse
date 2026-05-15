"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertSettingsAction } from "@/server/actions/settings";

const FIELDS: { key: string; label: string; hint?: string; placeholder?: string }[] = [
  {
    key: "default_price_per_download",
    label: "Precio por defecto por descarga",
    placeholder: "5.00",
  },
  {
    key: "default_revenue_share_pct",
    label: "Revenue share por defecto (%)",
    placeholder: "70",
    hint: "Porcentaje que se queda la empresa.",
  },
  { key: "default_currency", label: "Moneda por defecto", placeholder: "USD" },
  { key: "company_name", label: "Nombre de la empresa" },
];

export function SettingsForm({ initial }: { initial: { key: string; value: string }[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState(() => {
    const map = new Map(initial.map((x) => [x.key, x.value]));
    return FIELDS.map((f) => ({ key: f.key, value: map.get(f.key) ?? "" }));
  });

  function setValue(key: string, v: string) {
    setValues((cur) => cur.map((x) => (x.key === key ? { ...x, value: v } : x)));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await upsertSettingsAction(values);
      if (!r.ok) {
        toast.error(r.message ?? "Error al guardar");
        return;
      }
      toast.success("Configuración guardada");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {FIELDS.map((f) => {
        const current = values.find((x) => x.key === f.key)?.value ?? "";
        return (
          <div key={f.key} className="space-y-2">
            <Label>{f.label}</Label>
            <Input
              value={current}
              placeholder={f.placeholder}
              onChange={(e) => setValue(f.key, e.target.value)}
            />
            {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
          </div>
        );
      })}
      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Guardar
      </Button>
    </form>
  );
}

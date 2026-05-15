"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toggleCloudActiveAction } from "@/server/actions/venues";

interface Props {
  venueId: string;
  initialActive: boolean;
}

export function CloudToggle({ venueId, initialActive }: Props) {
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [isPending, startTransition] = useTransition();

  function onToggle(next: boolean) {
    setActive(next);
    startTransition(async () => {
      const r = await toggleCloudActiveAction(venueId, next);
      if (!r.ok) {
        toast.error(r.message ?? "No se pudo cambiar el estado");
        setActive(!next);
        return;
      }
      toast.success(next ? "Cloud activada" : "Cloud desactivada");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <Switch checked={active} onCheckedChange={onToggle} disabled={isPending} id={`cloud-${venueId}`} />
      <Label htmlFor={`cloud-${venueId}`} className="cursor-pointer">
        {active ? "Cloud activa" : "Cloud inactiva"}
      </Label>
    </div>
  );
}

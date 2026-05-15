"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { computeRoiScenario } from "@/lib/roi-math";
import { formatCurrency } from "@/lib/utils";

interface SettingsDefaults {
  defaultPrice: number;
  defaultShare: number;
}

export function RoiCalculator({ defaults }: { defaults: SettingsDefaults }) {
  const [installationCost, setCost] = useState(3000);
  const [downloads, setDownloads] = useState(120);
  const [price, setPrice] = useState(defaults.defaultPrice);
  const [share, setShare] = useState(defaults.defaultShare);
  const [months, setMonths] = useState(12);

  const result = useMemo(
    () =>
      computeRoiScenario({
        installationCost,
        downloadsPerMonth: downloads,
        pricePerDownload: price,
        revenueSharePct: share,
        months,
      }),
    [installationCost, downloads, price, share, months],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inputs</CardTitle>
          <CardDescription>Simulá un escenario y mirá el payback.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Costo de instalación</Label>
            <Input
              type="number"
              value={installationCost}
              onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>Descargas / mes</Label>
            <Input
              type="number"
              value={downloads}
              onChange={(e) => setDownloads(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>Precio por descarga</Label>
            <Input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>Revenue share (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={share}
              onChange={(e) => setShare(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Horizonte (meses)</Label>
            <Input
              type="number"
              value={months}
              onChange={(e) => setMonths(parseInt(e.target.value, 10) || 0)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resultado</CardTitle>
          <CardDescription>Todos los números en la moneda que asumas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Metric label="Revenue mensual" value={formatCurrency(result.monthlyRevenue)} />
            <Metric
              label="Payback"
              value={result.paybackMonths == null ? "—" : `${result.paybackMonths} meses`}
            />
            <Metric label={`Revenue total (${months}m)`} value={formatCurrency(result.totalRevenue)} />
            <Metric
              label="Ganancia neta"
              value={formatCurrency(result.netProfit)}
              accent={result.netProfit >= 0 ? "positive" : "negative"}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Fórmula: revenue mensual = descargas × precio × share/100. Payback = ceil(costo / revenue mensual).
            Ganancia neta = revenue total − costo de instalación.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "positive" | "negative";
}) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p
        className={
          accent === "positive"
            ? "text-xl font-semibold text-emerald-600"
            : accent === "negative"
              ? "text-xl font-semibold text-destructive"
              : "text-xl font-semibold"
        }
      >
        {value}
      </p>
    </div>
  );
}


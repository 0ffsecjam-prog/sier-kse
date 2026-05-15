import Link from "next/link";
import { Building2, CloudCog, Download, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/common/page-shell";
import { computeDashboardSummary } from "@/server/services/roi";
import { requireUser } from "@/server/auth/session";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { VENUE_STATUS_LABELS } from "@/lib/constants";
import { VENUE_STATUSES } from "@/lib/zod-schemas/venue";

export default async function DashboardPage() {
  await requireUser();
  const summary = await computeDashboardSummary();

  return (
    <PageShell title="Dashboard" description="Vista general del estado del negocio.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<Building2 className="h-4 w-4" />}
          label="Canchas totales"
          value={formatNumber(summary.totalVenues)}
        />
        <KpiCard
          icon={<CloudCog className="h-4 w-4" />}
          label="Activas en nube"
          value={formatNumber(summary.cloudActive)}
        />
        <KpiCard
          icon={<Download className="h-4 w-4" />}
          label="Descargas (este mes)"
          value={formatNumber(summary.downloadsThisMonth)}
        />
        <KpiCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Revenue (este mes)"
          value={formatCurrency(summary.revenueThisMonth)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Top 5 canchas por revenue acumulado</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.topVenues.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos todavía. Cargá descargas para ver el ranking.</p>
            ) : (
              <ol className="space-y-3">
                {summary.topVenues.map((v, i) => (
                  <li key={v.id} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                    <Link href={`/venues/${v.id}`} className="text-sm hover:underline">
                      <span className="mr-2 text-muted-foreground">#{i + 1}</span>
                      {v.name}
                    </Link>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(v.revenue)}</p>
                      <p className="text-xs text-muted-foreground">{formatNumber(v.downloads)} descargas</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {VENUE_STATUSES.map((s) => (
              <div key={s} className="flex items-center justify-between">
                <span>{VENUE_STATUS_LABELS[s]}</span>
                <Badge variant="outline">{summary.byStatus[s] ?? 0}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Costo de instalación acumulado" value={formatCurrency(summary.totalCost)} />
        <KpiCard label="Revenue acumulado (histórico)" value={formatCurrency(summary.totalRevenueAllTime)} />
        <KpiCard
          label="Net acumulado"
          value={formatCurrency(summary.totalRevenueAllTime - summary.totalCost)}
        />
      </div>
    </PageShell>
  );
}

function KpiCard({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

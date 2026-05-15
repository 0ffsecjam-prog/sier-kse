import Link from "next/link";
import { Download, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/empty-state";
import { PageShell } from "@/components/common/page-shell";
import { listAllDownloads } from "@/server/actions/downloads";
import { requireUser } from "@/server/auth/session";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { MONTH_LABELS } from "@/lib/constants";

export default async function DownloadsPage() {
  const user = await requireUser();
  const downloads = await listAllDownloads();
  const isAdmin = user.role === "ADMIN";

  const totalDl = downloads.reduce((acc, d) => acc + d.downloads, 0);
  const totalRevenue = downloads.reduce((acc, d) => {
    const price = d.unitPrice ? Number(d.unitPrice) : 0;
    const share = d.revenueSharePct ? Number(d.revenueSharePct) : 100;
    return acc + d.downloads * price * (share / 100);
  }, 0);

  const ranking = new Map<string, { id: string; name: string; total: number; revenue: number }>();
  for (const d of downloads) {
    const cur = ranking.get(d.venueId) ?? {
      id: d.venueId,
      name: d.venue.name,
      total: 0,
      revenue: 0,
    };
    const price = d.unitPrice ? Number(d.unitPrice) : 0;
    const share = d.revenueSharePct ? Number(d.revenueSharePct) : 100;
    cur.total += d.downloads;
    cur.revenue += d.downloads * price * (share / 100);
    ranking.set(d.venueId, cur);
  }
  const topVenues = [...ranking.values()].sort((a, b) => b.total - a.total).slice(0, 5);

  return (
    <PageShell
      title="Descargas globales"
      description={`${formatNumber(totalDl)} descargas · revenue acumulado ${formatCurrency(totalRevenue)} (sin convertir monedas)`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href="/api/export/downloads" target="_blank" rel="noopener">
              <Download className="h-4 w-4" />
              Export xlsx
            </a>
          </Button>
          {isAdmin && (
            <Button asChild size="sm">
              <Link href="/downloads/import">
                <Upload className="h-4 w-4" />
                Importar
              </Link>
            </Button>
          )}
        </div>
      }
    >
      {downloads.length === 0 ? (
        <EmptyState
          icon={<Download className="h-8 w-8" />}
          title="Sin descargas registradas"
          description="Cargá descargas mensuales desde el detalle de cada cancha."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Cancha</TableHead>
                    <TableHead className="text-right">Descargas</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {downloads.map((d) => {
                    const price = d.unitPrice ? Number(d.unitPrice) : 0;
                    const share = d.revenueSharePct ? Number(d.revenueSharePct) : 100;
                    const rev = d.downloads * price * (share / 100);
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="text-sm">
                          {MONTH_LABELS[d.month]} {d.year}
                        </TableCell>
                        <TableCell>
                          <Link href={`/venues/${d.venueId}`} className="hover:underline">
                            {d.venue.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatNumber(d.downloads)}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {price ? formatCurrency(price, d.venue.currency) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {rev ? formatCurrency(rev, d.venue.currency) : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">Top 5 canchas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {topVenues.map((v, i) => (
                <div key={v.id} className="flex items-center justify-between">
                  <Link href={`/venues/${v.id}`} className="hover:underline">
                    {i + 1}. {v.name}
                  </Link>
                  <span className="font-medium">{formatNumber(v.total)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}

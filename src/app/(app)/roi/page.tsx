import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageShell } from "@/components/common/page-shell";
import { RoiCalculator } from "@/components/roi/roi-calculator";
import { computeRoiForVenue } from "@/server/services/roi";
import { prisma } from "@/server/db/prisma";
import { requireUser } from "@/server/auth/session";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { FileSpreadsheet } from "lucide-react";

export default async function RoiPage() {
  await requireUser();

  const settings = await prisma.appSetting.findMany({
    where: { key: { in: ["default_price_per_download", "default_revenue_share_pct"] } },
  });
  const settingsMap = new Map(settings.map((s) => [s.key, s.value]));
  const defaultPrice = parseFloat(settingsMap.get("default_price_per_download") ?? "5") || 5;
  const defaultShare = parseFloat(settingsMap.get("default_revenue_share_pct") ?? "70") || 70;

  const venues = await prisma.venue.findMany({
    include: { sport: true },
    orderBy: { name: "asc" },
  });

  const rois = await Promise.all(venues.map((v) => computeRoiForVenue(v.id, 12)));
  const rows = venues.map((v, i) => ({ venue: v, roi: rois[i]! }));

  return (
    <PageShell
      title="ROI"
      description="Calculadora interactiva y payback real por cancha."
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href="/api/export/roi" target="_blank" rel="noopener">
            <FileSpreadsheet className="h-4 w-4" />
            Export xlsx
          </Link>
        </Button>
      }
    >
      <RoiCalculator defaults={{ defaultPrice, defaultShare }} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Por cancha</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Sin canchas cargadas.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cancha</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead className="text-right">Revenue acum.</TableHead>
                  <TableHead className="text-right">Rev. mensual (avg)</TableHead>
                  <TableHead className="text-right">Payback</TableHead>
                  <TableHead className="text-right">Forecast 12m</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ venue, roi }) => (
                  <TableRow key={venue.id}>
                    <TableCell>
                      <Link href={`/venues/${venue.id}`} className="font-medium hover:underline">
                        {venue.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">{venue.sport.name}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(roi.totalCost, venue.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(roi.totalRevenue, venue.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(roi.avgMonthlyRevenueLast3, venue.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {roi.paybackMonths == null ? "—" : `${formatNumber(roi.paybackMonths)} m`}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(roi.forecastRevenue, venue.currency)}
                    </TableCell>
                    <TableCell
                      className={
                        roi.forecastNetProfit >= 0
                          ? "text-right font-medium text-emerald-600"
                          : "text-right font-medium text-destructive"
                      }
                    >
                      {formatCurrency(roi.forecastNetProfit, venue.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}

import Link from "next/link";
import { Building2, Download, DollarSign, FileSpreadsheet, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/common/page-shell";

const REPORTS = [
  {
    title: "Canchas",
    description: "Todas las canchas con totales de costo y descargas.",
    href: "/api/export/venues",
    icon: Building2,
  },
  {
    title: "Descargas",
    description: "Conteo mensual con precio, share y revenue calculado.",
    href: "/api/export/downloads",
    icon: Download,
  },
  {
    title: "Costos",
    description: "Líneas de instalación con categoría y monto.",
    href: "/api/export/costs",
    icon: DollarSign,
  },
  {
    title: "ROI",
    description: "Payback, revenue acumulado y forecast 12 meses por cancha.",
    href: "/api/export/roi",
    icon: TrendingUp,
  },
];

export default function ReportsPage() {
  return (
    <PageShell title="Reportes" description="Exports a xlsx de cada vista.">
      <div className="grid gap-4 sm:grid-cols-2">
        {REPORTS.map((r) => {
          const Icon = r.icon;
          return (
            <Card key={r.href}>
              <CardHeader className="flex flex-row items-start gap-3 pb-3">
                <Icon className="mt-1 h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">{r.title}</CardTitle>
                  <CardDescription>{r.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" size="sm">
                  <Link href={r.href} target="_blank" rel="noopener">
                    <FileSpreadsheet className="h-4 w-4" />
                    Descargar xlsx
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}

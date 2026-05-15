import Link from "next/link";
import { DollarSign } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { listAllCosts } from "@/server/actions/costs";
import { requireUser } from "@/server/auth/session";
import { formatCurrency, formatDate } from "@/lib/utils";
import { COST_CATEGORY_LABELS } from "@/lib/constants";

export default async function CostsPage() {
  await requireUser();
  const costs = await listAllCosts();

  const total = costs.reduce((acc, c) => acc + Number(c.amount), 0);
  const byVenue = new Map<string, number>();
  for (const c of costs) {
    byVenue.set(c.venue.name, (byVenue.get(c.venue.name) ?? 0) + Number(c.amount));
  }

  return (
    <PageShell
      title="Costos globales"
      description={`${costs.length} líneas · total ${formatCurrency(total)} (suma sin convertir moneda)`}
    >
      {costs.length === 0 ? (
        <EmptyState
          icon={<DollarSign className="h-8 w-8" />}
          title="Sin costos registrados"
          description="Los gastos de instalación se cargan desde el detalle de cada cancha."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cancha</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costs.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="whitespace-nowrap text-sm">{formatDate(c.incurredAt)}</TableCell>
                    <TableCell>
                      <Link href={`/venues/${c.venueId}`} className="hover:underline">
                        {c.venue.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">{c.venue.sport.name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{COST_CATEGORY_LABELS[c.category]}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{c.description}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(c.amount), c.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}

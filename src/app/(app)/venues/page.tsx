import Link from "next/link";
import { Building2, Download, Plus, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { PageShell } from "@/components/common/page-shell";
import { VenueStatusBadge } from "@/components/venues/status-badge";
import { VenuesFilters } from "@/components/venues/venues-filters";
import { listVenues } from "@/server/actions/venues";
import { prisma } from "@/server/db/prisma";
import { requireUser } from "@/server/auth/session";
import { venueFilterSchema } from "@/lib/zod-schemas/venue";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function VenuesPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const sp = await searchParams;
  const filter = venueFilterSchema.parse({
    q: sp.q,
    status: sp.status,
    sportId: sp.sportId,
    cloudActive: sp.cloudActive,
  });

  const [venues, sports] = await Promise.all([
    listVenues(filter),
    prisma.sport.findMany({ orderBy: { name: "asc" } }),
  ]);

  const isAdmin = user.role === "ADMIN";

  return (
    <PageShell
      title="Canchas"
      description={`${venues.length} canchas en cartera`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href="/api/export/venues" target="_blank" rel="noopener">
              <Download className="h-4 w-4" />
              Export xlsx
            </a>
          </Button>
          {isAdmin && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href="/venues/import">
                  <Upload className="h-4 w-4" />
                  Importar
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/venues/new">
                  <Plus className="h-4 w-4" />
                  Nueva cancha
                </Link>
              </Button>
            </>
          )}
        </div>
      }
    >
      <VenuesFilters sports={sports.map((s) => ({ id: s.id, name: s.name }))} />

      {venues.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-8 w-8" />}
          title="Sin canchas todavía"
          description="Cargá tu primera cancha o importá un xlsx para arrancar."
          action={
            isAdmin && (
              <Button asChild>
                <Link href="/venues/new">
                  <Plus className="h-4 w-4" />
                  Crear cancha
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Deporte</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Cloud</TableHead>
                <TableHead>Dueño</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {venues.map((v) => (
                <TableRow key={v.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link href={`/venues/${v.id}`} className="hover:underline">
                      {v.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{v.address}</div>
                  </TableCell>
                  <TableCell>{v.sport.name}</TableCell>
                  <TableCell>{v.city ?? "—"}</TableCell>
                  <TableCell>
                    <VenueStatusBadge status={v.status} />
                  </TableCell>
                  <TableCell>
                    {v.cloudActive ? (
                      <Badge variant="success">Activa</Badge>
                    ) : (
                      <Badge variant="outline">—</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {v.ownerName ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageShell>
  );
}

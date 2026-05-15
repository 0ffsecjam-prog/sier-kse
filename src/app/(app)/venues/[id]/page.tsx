import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, MapPin, Phone, Mail, User as UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PageShell } from "@/components/common/page-shell";
import { VenueStatusBadge } from "@/components/venues/status-badge";
import { CloudToggle } from "@/components/venues/cloud-toggle";
import { DeleteVenueButton } from "@/components/venues/delete-venue-button";
import { CostFormDialog } from "@/components/costs/cost-form-dialog";
import { DeleteCostButton } from "@/components/costs/delete-cost-button";
import { DownloadFormDialog } from "@/components/downloads/download-form-dialog";
import { DeleteDownloadButton } from "@/components/downloads/delete-download-button";
import { AttachmentUpload } from "@/components/venues/attachment-upload";
import { DeleteAttachmentButton } from "@/components/venues/delete-attachment-button";
import { getVenue } from "@/server/actions/venues";
import { requireUser } from "@/server/auth/session";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { ATTACHMENT_KIND_LABELS, COST_CATEGORY_LABELS, MONTH_LABELS } from "@/lib/constants";

export default async function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const venue = await getVenue(id);
  if (!venue) notFound();

  const isAdmin = user.role === "ADMIN";

  const totalCost = venue.costs.reduce((acc, c) => acc + Number(c.amount), 0);
  const totalDownloads = venue.downloads.reduce((acc, d) => acc + d.downloads, 0);

  return (
    <PageShell
      title={venue.name}
      description={venue.address}
      actions={
        <div className="flex gap-2">
          {isAdmin && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/venues/${venue.id}/edit`}>
                <Pencil className="h-4 w-4" />
                Editar
              </Link>
            </Button>
          )}
          {isAdmin && <DeleteVenueButton venueId={venue.id} venueName={venue.name} redirectTo="/venues" />}
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Resumen</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{[venue.city, venue.country].filter(Boolean).join(", ") || venue.address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span>{venue.ownerName ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{venue.ownerPhone ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{venue.ownerEmail ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Deporte:</span>
              <span className="font-medium">{venue.sport.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Estado:</span>
              <VenueStatusBadge status={venue.status} />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Coords:</span>
              <span className="font-mono text-xs">
                {venue.latitude.toFixed(5)}, {venue.longitude.toFixed(5)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Precio / descarga:</span>
              <span>
                {venue.pricePerDownload ? formatCurrency(Number(venue.pricePerDownload), venue.currency) : "(default)"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Revenue share:</span>
              <span>{venue.revenueSharePct ? `${venue.revenueSharePct}%` : "(default)"}</span>
            </div>
            {venue.notes && (
              <div className="sm:col-span-2">
                <Separator className="my-2" />
                <p className="text-sm text-muted-foreground">{venue.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estado en la nube</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <CloudToggle venueId={venue.id} initialActive={venue.cloudActive} />
            {venue.cloudActivatedAt && (
              <p className="text-xs text-muted-foreground">
                Activada el {formatDate(venue.cloudActivatedAt)}
              </p>
            )}
            <Separator />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Costo total</p>
                <p className="font-medium">{formatCurrency(totalCost, venue.currency)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Descargas totales</p>
                <p className="font-medium">{formatNumber(totalDownloads)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="costs" className="space-y-3">
        <TabsList>
          <TabsTrigger value="costs">Costos ({venue.costs.length})</TabsTrigger>
          <TabsTrigger value="downloads">Descargas ({venue.downloads.length})</TabsTrigger>
          <TabsTrigger value="logs">Logs nube ({venue.cloudLogs.length})</TabsTrigger>
          <TabsTrigger value="attachments">Adjuntos ({venue.attachments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="costs" className="space-y-3">
          {isAdmin && (
            <div className="flex justify-end">
              <CostFormDialog venueId={venue.id} defaultCurrency={venue.currency} />
            </div>
          )}
          <Card>
            <CardContent className="p-0">
              {venue.costs.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">Sin costos cargados.</p>
              ) : (
                <div className="divide-y">
                  {venue.costs.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-4 text-sm">
                      <div>
                        <p className="font-medium">{c.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {COST_CATEGORY_LABELS[c.category]} · {formatDate(c.incurredAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{formatCurrency(Number(c.amount), c.currency)}</span>
                        {isAdmin && (
                          <>
                            <CostFormDialog
                              venueId={venue.id}
                              defaultCurrency={venue.currency}
                              cost={{
                                id: c.id,
                                category: c.category,
                                description: c.description,
                                amount: c.amount.toString(),
                                currency: c.currency,
                                incurredAt: c.incurredAt,
                              }}
                              triggerVariant="ghost"
                              triggerSize="icon"
                              triggerLabel=""
                            />
                            <DeleteCostButton id={c.id} />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="downloads" className="space-y-3">
          {isAdmin && (
            <div className="flex justify-end">
              <DownloadFormDialog venueId={venue.id} />
            </div>
          )}
          <Card>
            <CardContent className="p-0">
              {venue.downloads.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">Sin descargas cargadas.</p>
              ) : (
                <div className="divide-y">
                  {venue.downloads.map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-4 text-sm">
                      <div>
                        <p className="font-medium">
                          {MONTH_LABELS[d.month]} {d.year}
                        </p>
                        {d.notes && <p className="text-xs text-muted-foreground">{d.notes}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-medium">{formatNumber(d.downloads)} descargas</p>
                          {d.unitPrice && (
                            <p className="text-xs text-muted-foreground">
                              @ {formatCurrency(Number(d.unitPrice), venue.currency)} · {d.revenueSharePct?.toString() ?? "—"}%
                            </p>
                          )}
                        </div>
                        {isAdmin && (
                          <>
                            <DownloadFormDialog
                              venueId={venue.id}
                              record={{
                                id: d.id,
                                year: d.year,
                                month: d.month,
                                downloads: d.downloads,
                                unitPrice: d.unitPrice?.toString() ?? null,
                                revenueSharePct: d.revenueSharePct?.toString() ?? null,
                                notes: d.notes,
                              }}
                            />
                            <DeleteDownloadButton id={d.id} />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardContent className="p-0">
              {venue.cloudLogs.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">Sin cambios registrados.</p>
              ) : (
                <div className="divide-y">
                  {venue.cloudLogs.map((l) => (
                    <div key={l.id} className="flex items-center justify-between p-4 text-sm">
                      <div>
                        <p className="font-medium">
                          {l.active ? "Activada" : "Desactivada"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          por {l.changedBy.name} · {formatDate(l.changedAt)}
                        </p>
                        {l.reason && <p className="text-xs italic">{l.reason}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attachments" className="space-y-3">
          <Card>
            <CardContent className="pt-6">
              <AttachmentUpload venueId={venue.id} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              {venue.attachments.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">Sin adjuntos cargados.</p>
              ) : (
                <div className="divide-y">
                  {venue.attachments.map((a) => {
                    const sizeKb = Math.round(a.sizeBytes / 102.4) / 10;
                    return (
                      <div key={a.id} className="flex items-center justify-between p-4 text-sm">
                        <div>
                          <a
                            href={`/api/uploads/${a.id}`}
                            target="_blank"
                            rel="noopener"
                            className="font-medium hover:underline"
                          >
                            {a.filename}
                          </a>
                          <p className="text-xs text-muted-foreground">
                            {ATTACHMENT_KIND_LABELS[a.kind]} · {sizeKb} KB · {formatDate(a.uploadedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={`/api/uploads/${a.id}?dl=1`}
                            className="text-xs text-sky-600 hover:underline"
                          >
                            Descargar
                          </a>
                          {isAdmin && (
                            <DeleteAttachmentButton id={a.id} filename={a.filename} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

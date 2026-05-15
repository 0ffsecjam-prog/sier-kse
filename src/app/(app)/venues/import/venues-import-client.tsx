"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import {
  previewVenuesImport,
  commitVenuesImport,
  type VenueImportRow,
} from "@/server/actions/imports";
import type { ImportPreview } from "@/server/services/import-xlsx";

export function VenuesImportClient() {
  const router = useRouter();
  const [preview, setPreview] = useState<ImportPreview<VenueImportRow> | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isImporting, startImport] = useTransition();

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    startTransition(async () => {
      const result = await previewVenuesImport(fd);
      setPreview(result);
    });
  }

  function onConfirm() {
    if (!preview || preview.ok.length === 0) return;
    startImport(async () => {
      const r = await commitVenuesImport(preview.ok.map((row) => row.data));
      if (!r.ok) {
        toast.error(r.message ?? "Error al importar");
        return;
      }
      toast.success(
        `Importadas ${r.data?.inserted ?? 0} canchas (${r.data?.skippedMissingSport ?? 0} salteadas por deporte inexistente).`,
      );
      router.push("/venues");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={onFile}
            disabled={isPending}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
          />
          {isPending && (
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Procesando archivo...
            </p>
          )}
        </CardContent>
      </Card>

      {preview && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">{preview.ok.length} válidas</Badge>
            <Badge variant="destructive">{preview.errors.length} con error</Badge>
            <span className="text-xs text-muted-foreground">
              Columnas encontradas: {preview.headersFound.join(", ") || "(ninguna)"}
            </span>
          </div>

          {preview.errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Filas con errores</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Fila</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.errors.map((e, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{e.row}</TableCell>
                        <TableCell className="text-sm text-destructive">{e.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {preview.ok.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Vista previa ({preview.ok.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Dirección</TableHead>
                      <TableHead>Ciudad</TableHead>
                      <TableHead>Deporte</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Coords</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.ok.slice(0, 100).map((p) => (
                      <TableRow key={p.row}>
                        <TableCell className="font-medium">{p.data.name}</TableCell>
                        <TableCell className="text-sm">{p.data.address}</TableCell>
                        <TableCell className="text-sm">{p.data.city ?? "—"}</TableCell>
                        <TableCell className="text-sm">{p.data.sportName}</TableCell>
                        <TableCell className="text-sm">{p.data.status}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {p.data.latitude.toFixed(4)}, {p.data.longitude.toFixed(4)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {preview.ok.length > 100 && (
                  <p className="p-3 text-center text-xs text-muted-foreground">
                    Mostrando 100 de {preview.ok.length} filas válidas.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button onClick={onConfirm} disabled={preview.ok.length === 0 || isImporting}>
              {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Importar {preview.ok.length} cancha{preview.ok.length === 1 ? "" : "s"}
            </Button>
            <Button variant="outline" onClick={() => setPreview(null)}>
              Cancelar
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

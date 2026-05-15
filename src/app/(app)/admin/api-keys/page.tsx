import { KeyRound } from "lucide-react";

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
import { ApiKeyFormDialog } from "@/components/admin/api-key-form-dialog";
import { DeleteApiKeyButton } from "@/components/admin/delete-api-key-button";
import { listApiKeys } from "@/server/actions/api-keys";
import { formatDate } from "@/lib/utils";

export default async function AdminApiKeysPage() {
  const keys = await listApiKeys();

  return (
    <PageShell
      title="API keys"
      description="Google Maps, OAuth, OpenAI, etc. Las keys se guardan encriptadas."
      actions={<ApiKeyFormDialog />}
    >
      {keys.length === 0 ? (
        <EmptyState
          icon={<KeyRound className="h-8 w-8" />}
          title="Sin keys cargadas"
          description="Las keys se cifran con AES-256-GCM. Sólo se ven completas al crearlas."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Etiqueta</TableHead>
                  <TableHead>Termina en</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creada</TableHead>
                  <TableHead>Rotada</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.provider}</TableCell>
                    <TableCell>{k.label}</TableCell>
                    <TableCell className="font-mono text-xs">****{k.lastFour}</TableCell>
                    <TableCell>
                      {k.active ? (
                        <Badge variant="success">Activa</Badge>
                      ) : (
                        <Badge variant="outline">Inactiva</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(k.createdAt)}</TableCell>
                    <TableCell className="text-sm">
                      {k.rotatedAt ? formatDate(k.rotatedAt) : "—"}
                    </TableCell>
                    <TableCell className="flex justify-end gap-1">
                      <ApiKeyFormDialog
                        apiKey={{
                          id: k.id,
                          provider: k.provider,
                          label: k.label,
                          active: k.active,
                        }}
                      />
                      <DeleteApiKeyButton id={k.id} provider={k.provider} label={k.label} />
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

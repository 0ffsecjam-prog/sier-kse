import { Users } from "lucide-react";

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
import { UserFormDialog } from "@/components/admin/user-form-dialog";
import { DeleteUserButton } from "@/components/admin/delete-user-button";
import { listUsers } from "@/server/actions/users";
import { getCurrentUser } from "@/server/auth/session";
import { formatDate } from "@/lib/utils";

export default async function AdminUsersPage() {
  const current = await getCurrentUser();
  const users = await listUsers();

  return (
    <PageShell
      title="Usuarios"
      description={`${users.length} cuenta(s) registrada(s).`}
      actions={<UserFormDialog />}
    >
      {users.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="Sin usuarios"
          description="Creá un usuario para que pueda loguearse al panel."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const isSelf = current?.id === u.id;
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.name}
                        {isSelf && <span className="ml-2 text-xs text-muted-foreground">(vos)</span>}
                      </TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === "ADMIN" ? "default" : "outline"}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.active ? (
                          <Badge variant="success">Activo</Badge>
                        ) : (
                          <Badge variant="destructive">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(u.createdAt)}</TableCell>
                      <TableCell className="flex justify-end gap-1">
                        <UserFormDialog
                          user={{
                            id: u.id,
                            email: u.email,
                            name: u.name,
                            role: u.role,
                            active: u.active,
                          }}
                        />
                        {!isSelf && <DeleteUserButton id={u.id} email={u.email} />}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}

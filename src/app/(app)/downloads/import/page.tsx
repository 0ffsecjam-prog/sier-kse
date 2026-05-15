import { redirect } from "next/navigation";
import { PageShell } from "@/components/common/page-shell";
import { DownloadsImportClient } from "./downloads-import-client";
import { getCurrentUser } from "@/server/auth/session";

export default async function DownloadsImportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/downloads");

  return (
    <PageShell
      title="Importar descargas"
      description="Subí un xlsx con columnas: cancha, año, mes, descargas (y opcionalmente precio, share, notas)."
    >
      <DownloadsImportClient />
    </PageShell>
  );
}

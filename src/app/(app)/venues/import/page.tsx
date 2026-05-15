import { redirect } from "next/navigation";
import { PageShell } from "@/components/common/page-shell";
import { VenuesImportClient } from "./venues-import-client";
import { getCurrentUser } from "@/server/auth/session";

export default async function VenuesImportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/venues");

  return (
    <PageShell
      title="Importar canchas"
      description="Subí un xlsx con columnas: nombre, dirección, latitud, longitud, deporte (y opcionalmente ciudad, país, estado, dueño, teléfono, email, notas)."
    >
      <VenuesImportClient />
    </PageShell>
  );
}

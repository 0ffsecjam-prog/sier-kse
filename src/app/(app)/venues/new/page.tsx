import { redirect } from "next/navigation";
import { PageShell } from "@/components/common/page-shell";
import { VenueForm } from "@/components/venues/venue-form";
import { prisma } from "@/server/db/prisma";
import { getCurrentUser } from "@/server/auth/session";

export default async function NewVenuePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/venues");

  const sports = await prisma.sport.findMany({ orderBy: { name: "asc" } });

  return (
    <PageShell title="Nueva cancha" description="Cargá los datos básicos. Después podés sumar costos, descargas y adjuntos.">
      <div className="max-w-3xl rounded-lg border bg-card p-6">
        <VenueForm sports={sports.map((s) => ({ id: s.id, name: s.name }))} />
      </div>
    </PageShell>
  );
}

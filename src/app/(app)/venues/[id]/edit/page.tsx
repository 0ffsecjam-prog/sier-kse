import { notFound, redirect } from "next/navigation";
import { PageShell } from "@/components/common/page-shell";
import { VenueForm } from "@/components/venues/venue-form";
import { prisma } from "@/server/db/prisma";
import { getCurrentUser } from "@/server/auth/session";

export default async function EditVenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/venues");

  const { id } = await params;
  const [venue, sports] = await Promise.all([
    prisma.venue.findUnique({ where: { id } }),
    prisma.sport.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!venue) notFound();

  return (
    <PageShell title="Editar cancha" description={venue.name}>
      <div className="max-w-3xl rounded-lg border bg-card p-6">
        <VenueForm
          venueId={venue.id}
          sports={sports.map((s) => ({ id: s.id, name: s.name }))}
          defaultValues={{
            name: venue.name,
            address: venue.address,
            city: venue.city ?? "",
            country: venue.country ?? "",
            latitude: venue.latitude,
            longitude: venue.longitude,
            sportId: venue.sportId,
            status: venue.status,
            ownerName: venue.ownerName ?? "",
            ownerPhone: venue.ownerPhone ?? "",
            ownerEmail: venue.ownerEmail ?? "",
            notes: venue.notes ?? "",
            pricePerDownload: venue.pricePerDownload?.toString() ?? "",
            revenueSharePct: venue.revenueSharePct?.toString() ?? "",
            currency: venue.currency,
          }}
        />
      </div>
    </PageShell>
  );
}

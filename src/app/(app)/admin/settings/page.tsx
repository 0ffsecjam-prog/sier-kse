import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/common/page-shell";
import { SettingsForm } from "@/components/admin/settings-form";
import { listSettings } from "@/server/actions/settings";

export default async function AdminSettingsPage() {
  const settings = await listSettings();
  return (
    <PageShell
      title="Configuración"
      description="Valores por defecto que aplican cuando una cancha no tiene override."
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Defaults globales</CardTitle>
          <CardDescription>
            Se usan para el cálculo de revenue cuando una cancha no define su propio precio o share.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm initial={settings} />
        </CardContent>
      </Card>
    </PageShell>
  );
}

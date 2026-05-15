import { auth } from "@/server/auth/auth";
import { buildCostsWorkbook } from "@/server/services/export-xlsx";

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const buf = await buildCostsWorkbook();
  const filename = `costos-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

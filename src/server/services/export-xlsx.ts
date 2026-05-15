import ExcelJS from "exceljs";

import { prisma } from "@/server/db/prisma";
import { COST_CATEGORY_LABELS, MONTH_LABELS, VENUE_STATUS_LABELS } from "@/lib/constants";
import { computeRoiForVenue } from "@/server/services/roi";

function headerStyle(ws: ExcelJS.Worksheet) {
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).alignment = { vertical: "middle" };
  ws.getRow(1).height = 22;
}

export async function buildVenuesWorkbook(): Promise<Buffer> {
  const venues = await prisma.venue.findMany({
    include: {
      sport: true,
      costs: true,
      downloads: true,
    },
    orderBy: { name: "asc" },
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = "sier-kse";
  wb.created = new Date();

  const ws = wb.addWorksheet("Canchas");
  ws.columns = [
    { header: "Nombre", key: "name", width: 30 },
    { header: "Estado", key: "status", width: 14 },
    { header: "Deporte", key: "sport", width: 16 },
    { header: "Dirección", key: "address", width: 32 },
    { header: "Ciudad", key: "city", width: 18 },
    { header: "País", key: "country", width: 14 },
    { header: "Latitud", key: "lat", width: 12 },
    { header: "Longitud", key: "lng", width: 12 },
    { header: "Dueño", key: "owner", width: 22 },
    { header: "Teléfono", key: "phone", width: 16 },
    { header: "Email", key: "email", width: 22 },
    { header: "Cloud activa", key: "cloud", width: 12 },
    { header: "Costo total", key: "totalCost", width: 14 },
    { header: "Descargas totales", key: "totalDownloads", width: 16 },
    { header: "Moneda", key: "currency", width: 10 },
    { header: "Precio descarga", key: "price", width: 14 },
    { header: "Share %", key: "share", width: 10 },
    { header: "Creada", key: "created", width: 14 },
  ];

  venues.forEach((v) => {
    const totalCost = v.costs.reduce((acc, c) => acc + Number(c.amount), 0);
    const totalDl = v.downloads.reduce((acc, d) => acc + d.downloads, 0);
    ws.addRow({
      name: v.name,
      status: VENUE_STATUS_LABELS[v.status as keyof typeof VENUE_STATUS_LABELS] ?? v.status,
      sport: v.sport.name,
      address: v.address,
      city: v.city ?? "",
      country: v.country ?? "",
      lat: v.latitude,
      lng: v.longitude,
      owner: v.ownerName ?? "",
      phone: v.ownerPhone ?? "",
      email: v.ownerEmail ?? "",
      cloud: v.cloudActive ? "Sí" : "No",
      totalCost,
      totalDownloads: totalDl,
      currency: v.currency,
      price: v.pricePerDownload ? Number(v.pricePerDownload) : "",
      share: v.revenueSharePct ? Number(v.revenueSharePct) : "",
      created: v.createdAt,
    });
  });
  headerStyle(ws);
  ws.getColumn("totalCost").numFmt = "#,##0.00";
  ws.getColumn("price").numFmt = "#,##0.00";
  ws.getColumn("totalDownloads").numFmt = "#,##0";

  return Buffer.from(await wb.xlsx.writeBuffer());
}

export async function buildDownloadsWorkbook(): Promise<Buffer> {
  const records = await prisma.downloadRecord.findMany({
    include: { venue: { include: { sport: true } } },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = "sier-kse";
  const ws = wb.addWorksheet("Descargas");
  ws.columns = [
    { header: "Año", key: "year", width: 8 },
    { header: "Mes", key: "month", width: 12 },
    { header: "Cancha", key: "venue", width: 28 },
    { header: "Deporte", key: "sport", width: 14 },
    { header: "Descargas", key: "downloads", width: 12 },
    { header: "Precio unitario", key: "price", width: 14 },
    { header: "Share %", key: "share", width: 10 },
    { header: "Revenue", key: "revenue", width: 14 },
    { header: "Moneda", key: "currency", width: 10 },
    { header: "Notas", key: "notes", width: 30 },
  ];
  records.forEach((d) => {
    const price = d.unitPrice ? Number(d.unitPrice) : 0;
    const share = d.revenueSharePct ? Number(d.revenueSharePct) : 100;
    const rev = d.downloads * price * (share / 100);
    ws.addRow({
      year: d.year,
      month: MONTH_LABELS[d.month],
      venue: d.venue.name,
      sport: d.venue.sport.name,
      downloads: d.downloads,
      price,
      share,
      revenue: rev,
      currency: d.venue.currency,
      notes: d.notes ?? "",
    });
  });
  headerStyle(ws);
  ws.getColumn("price").numFmt = "#,##0.00";
  ws.getColumn("revenue").numFmt = "#,##0.00";
  ws.getColumn("downloads").numFmt = "#,##0";
  return Buffer.from(await wb.xlsx.writeBuffer());
}

export async function buildCostsWorkbook(): Promise<Buffer> {
  const costs = await prisma.installationCost.findMany({
    include: { venue: true },
    orderBy: { incurredAt: "desc" },
  });
  const wb = new ExcelJS.Workbook();
  wb.creator = "sier-kse";
  const ws = wb.addWorksheet("Costos");
  ws.columns = [
    { header: "Fecha", key: "date", width: 14 },
    { header: "Cancha", key: "venue", width: 28 },
    { header: "Categoría", key: "category", width: 16 },
    { header: "Descripción", key: "description", width: 36 },
    { header: "Monto", key: "amount", width: 14 },
    { header: "Moneda", key: "currency", width: 10 },
  ];
  costs.forEach((c) => {
    ws.addRow({
      date: c.incurredAt,
      venue: c.venue.name,
      category: COST_CATEGORY_LABELS[c.category],
      description: c.description,
      amount: Number(c.amount),
      currency: c.currency,
    });
  });
  headerStyle(ws);
  ws.getColumn("amount").numFmt = "#,##0.00";
  ws.getColumn("date").numFmt = "yyyy-mm-dd";
  return Buffer.from(await wb.xlsx.writeBuffer());
}

export async function buildRoiWorkbook(): Promise<Buffer> {
  const venues = await prisma.venue.findMany({
    include: { sport: true },
    orderBy: { name: "asc" },
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = "sier-kse";
  const ws = wb.addWorksheet("ROI");
  ws.columns = [
    { header: "Cancha", key: "venue", width: 28 },
    { header: "Deporte", key: "sport", width: 14 },
    { header: "Estado", key: "status", width: 14 },
    { header: "Costo total", key: "cost", width: 14 },
    { header: "Revenue acumulado", key: "revAcc", width: 18 },
    { header: "Revenue prom. mensual (últ 3)", key: "revAvg", width: 22 },
    { header: "Payback (meses)", key: "payback", width: 14 },
    { header: "Forecast 12 meses", key: "forecast12", width: 18 },
    { header: "Moneda", key: "currency", width: 10 },
  ];

  for (const v of venues) {
    const roi = await computeRoiForVenue(v.id, 12);
    ws.addRow({
      venue: v.name,
      sport: v.sport.name,
      status: VENUE_STATUS_LABELS[v.status as keyof typeof VENUE_STATUS_LABELS],
      cost: roi.totalCost,
      revAcc: roi.totalRevenue,
      revAvg: roi.avgMonthlyRevenueLast3,
      payback: roi.paybackMonths ?? "—",
      forecast12: roi.forecastRevenue,
      currency: v.currency,
    });
  }
  headerStyle(ws);
  ws.getColumn("cost").numFmt = "#,##0.00";
  ws.getColumn("revAcc").numFmt = "#,##0.00";
  ws.getColumn("revAvg").numFmt = "#,##0.00";
  ws.getColumn("forecast12").numFmt = "#,##0.00";
  return Buffer.from(await wb.xlsx.writeBuffer());
}

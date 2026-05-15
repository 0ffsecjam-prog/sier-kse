import { prisma } from "@/server/db/prisma";
import { computeRoiScenario as computeRoiScenarioImpl } from "@/lib/roi-math";

export type { RoiScenarioInput, RoiScenarioResult } from "@/lib/roi-math";

export interface RoiResult {
  venueId: string;
  totalCost: number;
  totalRevenue: number;
  totalDownloads: number;
  avgMonthlyRevenueLast3: number;
  paybackMonths: number | null;
  forecastRevenue: number;
  forecastNetProfit: number;
  currency: string;
}

function revenueFromRecord(d: { downloads: number; unitPrice: unknown; revenueSharePct: unknown }) {
  const price = d.unitPrice ? Number(d.unitPrice as string | number) : 0;
  const share = d.revenueSharePct ? Number(d.revenueSharePct as string | number) : 100;
  return d.downloads * price * (share / 100);
}

export async function computeRoiForVenue(
  venueId: string,
  forecastMonths = 12,
): Promise<RoiResult> {
  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    include: {
      costs: true,
      downloads: { orderBy: [{ year: "desc" }, { month: "desc" }] },
    },
  });
  if (!venue) {
    return {
      venueId,
      totalCost: 0,
      totalRevenue: 0,
      totalDownloads: 0,
      avgMonthlyRevenueLast3: 0,
      paybackMonths: null,
      forecastRevenue: 0,
      forecastNetProfit: 0,
      currency: "USD",
    };
  }

  const totalCost = venue.costs.reduce((acc, c) => acc + Number(c.amount), 0);
  const totalDownloads = venue.downloads.reduce((acc, d) => acc + d.downloads, 0);
  const totalRevenue = venue.downloads.reduce((acc, d) => acc + revenueFromRecord(d), 0);

  const last3 = venue.downloads.slice(0, 3);
  const avgMonthly =
    last3.length === 0
      ? 0
      : last3.reduce((acc, d) => acc + revenueFromRecord(d), 0) / last3.length;

  const paybackMonths =
    avgMonthly > 0 ? Math.ceil(Math.max(0, totalCost - totalRevenue) / avgMonthly) : null;

  const forecastRevenue = avgMonthly * forecastMonths;
  const forecastNetProfit = totalRevenue + forecastRevenue - totalCost;

  return {
    venueId,
    totalCost,
    totalRevenue,
    totalDownloads,
    avgMonthlyRevenueLast3: avgMonthly,
    paybackMonths,
    forecastRevenue,
    forecastNetProfit,
    currency: venue.currency,
  };
}

export const computeRoiScenario = computeRoiScenarioImpl;

export async function computeDashboardSummary() {
  const [venues, downloads, costs] = await Promise.all([
    prisma.venue.findMany({ select: { id: true, status: true, cloudActive: true, currency: true } }),
    prisma.downloadRecord.findMany({
      include: { venue: { select: { name: true, currency: true } } },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    }),
    prisma.installationCost.findMany(),
  ]);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const totalVenues = venues.length;
  const byStatus = venues.reduce<Record<string, number>>((acc, v) => {
    acc[v.status] = (acc[v.status] ?? 0) + 1;
    return acc;
  }, {});
  const cloudActive = venues.filter((v) => v.cloudActive).length;

  const downloadsThisMonth = downloads
    .filter((d) => d.year === currentYear && d.month === currentMonth)
    .reduce((acc, d) => acc + d.downloads, 0);
  const revenueThisMonth = downloads
    .filter((d) => d.year === currentYear && d.month === currentMonth)
    .reduce((acc, d) => acc + revenueFromRecord(d), 0);

  const totalCost = costs.reduce((acc, c) => acc + Number(c.amount), 0);
  const totalRevenueAllTime = downloads.reduce((acc, d) => acc + revenueFromRecord(d), 0);

  const venueRevenue = new Map<string, { id: string; name: string; revenue: number; downloads: number }>();
  for (const d of downloads) {
    const cur = venueRevenue.get(d.venueId) ?? {
      id: d.venueId,
      name: d.venue.name,
      revenue: 0,
      downloads: 0,
    };
    cur.revenue += revenueFromRecord(d);
    cur.downloads += d.downloads;
    venueRevenue.set(d.venueId, cur);
  }
  const topVenues = [...venueRevenue.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    totalVenues,
    byStatus,
    cloudActive,
    downloadsThisMonth,
    revenueThisMonth,
    totalCost,
    totalRevenueAllTime,
    topVenues,
  };
}

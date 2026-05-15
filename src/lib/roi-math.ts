export interface RoiScenarioInput {
  installationCost: number;
  downloadsPerMonth: number;
  pricePerDownload: number;
  revenueSharePct: number;
  months: number;
}

export interface RoiScenarioResult {
  monthlyRevenue: number;
  paybackMonths: number | null;
  totalRevenue: number;
  netProfit: number;
}

export function computeRoiScenario(input: RoiScenarioInput): RoiScenarioResult {
  const monthlyRevenue =
    input.downloadsPerMonth * input.pricePerDownload * (input.revenueSharePct / 100);
  const paybackMonths =
    monthlyRevenue > 0 ? Math.ceil(input.installationCost / monthlyRevenue) : null;
  const totalRevenue = monthlyRevenue * input.months;
  const netProfit = totalRevenue - input.installationCost;
  return { monthlyRevenue, paybackMonths, totalRevenue, netProfit };
}

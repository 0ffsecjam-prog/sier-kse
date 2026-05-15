import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_SPORTS = [
  { name: "Pádel", slug: "padel" },
  { name: "Fútbol 5", slug: "futbol-5" },
  { name: "Fútbol 7", slug: "futbol-7" },
  { name: "Fútbol 11", slug: "futbol-11" },
  { name: "Tenis", slug: "tenis" },
  { name: "Básquet", slug: "basquet" },
  { name: "Vóley", slug: "voley" },
  { name: "Hockey", slug: "hockey" },
];

const DEFAULT_SETTINGS = [
  { key: "default_price_per_download", value: "5.00" },
  { key: "default_revenue_share_pct", value: "70" },
  { key: "default_currency", value: "USD" },
  { key: "company_name", value: "sier-kse" },
];

async function main() {
  console.log("[seed] Starting...");

  for (const s of DEFAULT_SPORTS) {
    await prisma.sport.upsert({
      where: { slug: s.slug },
      update: {},
      create: s,
    });
  }
  console.log(`[seed] Sports ensured: ${DEFAULT_SPORTS.length}`);

  for (const s of DEFAULT_SETTINGS) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log(`[seed] Settings ensured: ${DEFAULT_SETTINGS.length}`);

  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@local";
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "change-me-now";
  const adminName = process.env.INITIAL_ADMIN_NAME || "Admin";

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        passwordHash,
        role: "ADMIN",
        active: true,
      },
    });
    console.log(`[seed] Admin created: ${adminEmail}`);
  } else {
    console.log(`[seed] Admin already exists: ${adminEmail}`);
  }

  console.log("[seed] Done.");
}

main()
  .catch((e) => {
    console.error("[seed] Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

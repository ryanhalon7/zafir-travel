import { existsSync, readFileSync } from "node:fs";

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return;
  }

  const lines = readFileSync(path, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);

    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    const value = rawValue.replace(/^["']|["']$/g, "");
    process.env[key] ??= value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

try {
  const [tables] = await prisma.$queryRawUnsafe(`
    select
      to_regclass('public.users')::text as users,
      to_regclass('public.trips')::text as trips,
      to_regclass('public.trip_members')::text as trip_members
  `);

  const missing = Object.entries(tables)
    .filter(([, value]) => value === null)
    .map(([name]) => name);

  if (missing.length > 0) {
    console.error(`Missing Phase 1 tables: ${missing.join(", ")}`);
    process.exit(1);
  }

  console.log("Phase 1 database tables are present.");
} finally {
  await prisma.$disconnect();
}

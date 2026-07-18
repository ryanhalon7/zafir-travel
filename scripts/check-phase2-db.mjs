import { existsSync, readFileSync } from "node:fs";

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return;
  }

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);

    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    process.env[key] ??= rawValue.replace(/^["']|["']$/g, "");
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

try {
  const [tables] = await prisma.$queryRawUnsafe(`
    select
      to_regclass('public.trip_days')::text as trip_days,
      to_regclass('public.itinerary_events')::text as itinerary_events
  `);

  const missing = Object.entries(tables)
    .filter(([, value]) => value === null)
    .map(([name]) => name);

  if (missing.length > 0) {
    console.error(`Missing Phase 2 tables: ${missing.join(", ")}`);
    process.exit(1);
  }

  const trip = await prisma.trip.findUnique({
    where: { id: "seed-morocco-anniversary" },
    include: {
      days: true,
      events: true,
      members: true,
      expenses: true,
      packingItems: true,
      photos: true,
      documents: true,
    },
  });

  const users = await prisma.user.findMany({
    select: { id: true, email: true },
    orderBy: { createdAt: "asc" },
  });

  if (!trip) {
    console.error("Morocco seed trip is missing.");
    process.exit(1);
  }

  console.log("App users:", users.map((user) => `${user.email} (${user.id})`).join(", "));
  console.log("Morocco seed counts:", {
    members: trip.members.length,
    days: trip.days.length,
    events: trip.events.length,
    expenses: trip.expenses.length,
    packingItems: trip.packingItems.length,
    photos: trip.photos.length,
    documents: trip.documents.length,
  });

  if (
    trip.days.length !== 6 ||
    trip.events.length < 8 ||
    trip.members.length < 1 ||
    trip.expenses.length < 1 ||
    trip.packingItems.length < 1 ||
    trip.photos.length < 1 ||
    trip.documents.length < 1
  ) {
    console.error("Phase 2 seed data is missing or incomplete.");
    process.exit(1);
  }

  console.log("Phase 2 database tables and seed trip are present.");
} finally {
  await prisma.$disconnect();
}

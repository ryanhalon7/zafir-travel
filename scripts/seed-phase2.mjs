import { existsSync, readFileSync } from "node:fs";
import { PrismaClient, EventCategory, TripMemberRole, TripStatus } from "@prisma/client";

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

const prisma = new PrismaClient();

const tripId = "seed-morocco-anniversary";
const travelerOneId = "11111111-1111-4111-8111-111111111111";
const travelerTwoId = "22222222-2222-4222-8222-222222222222";

function date(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

function time(day, value) {
  const [hours, minutes] = value.split(":").map(Number);
  const next = new Date(day);
  next.setUTCHours(hours, minutes, 0, 0);
  return next;
}

async function upsertDay(tripId, dayNumber, dayDate) {
  return prisma.tripDay.upsert({
    where: {
      tripId_date: {
        tripId,
        date: dayDate,
      },
    },
    update: {
      dayNumber,
    },
    create: {
      tripId,
      dayNumber,
      date: dayDate,
    },
  });
}

try {
  await prisma.user.upsert({
    where: { id: travelerOneId },
    update: {
      email: "ryan@example.com",
      displayName: "Ryan",
    },
    create: {
      id: travelerOneId,
      email: "ryan@example.com",
      displayName: "Ryan",
    },
  });

  await prisma.user.upsert({
    where: { id: travelerTwoId },
    update: {
      email: "moka@example.com",
      displayName: "Moka",
    },
    create: {
      id: travelerTwoId,
      email: "moka@example.com",
      displayName: "Moka",
    },
  });

  await prisma.trip.upsert({
    where: { id: tripId },
    update: {
      name: "Morocco Anniversary Escape",
      destinations: ["Marrakesh", "Atlas Mountains", "Essaouira"],
      startDate: date("2026-10-08"),
      endDate: date("2026-10-13"),
      status: TripStatus.UPCOMING,
      coverPhotoUrl:
        "https://images.unsplash.com/photo-1548018560-c7196548e84d?auto=format&fit=crop&w=1600&q=80",
      coverPhotoPath: null,
    },
    create: {
      id: tripId,
      name: "Morocco Anniversary Escape",
      destinations: ["Marrakesh", "Atlas Mountains", "Essaouira"],
      startDate: date("2026-10-08"),
      endDate: date("2026-10-13"),
      status: TripStatus.UPCOMING,
      inviteCode: "ZAFIR26",
      createdById: travelerOneId,
      coverPhotoUrl:
        "https://images.unsplash.com/photo-1548018560-c7196548e84d?auto=format&fit=crop&w=1600&q=80",
      members: {
        create: {
          userId: travelerOneId,
          role: TripMemberRole.OWNER,
        },
      },
    },
  });

  await prisma.tripMember.upsert({
    where: {
      tripId_userId: {
        tripId,
        userId: travelerOneId,
      },
    },
    update: {
      role: TripMemberRole.OWNER,
    },
    create: {
      tripId,
      userId: travelerOneId,
      role: TripMemberRole.OWNER,
    },
  });

  await prisma.tripMember.deleteMany({
    where: {
      tripId,
      userId: travelerTwoId,
    },
  });

  await prisma.itineraryEvent.deleteMany({
    where: { tripId },
  });
  await prisma.tripDay.deleteMany({
    where: { tripId },
  });

  const dayOne = await upsertDay(tripId, 1, date("2026-10-08"));
  const dayTwo = await upsertDay(tripId, 2, date("2026-10-09"));
  const dayThree = await upsertDay(tripId, 3, date("2026-10-10"));
  const dayFour = await upsertDay(tripId, 4, date("2026-10-11"));
  const dayFive = await upsertDay(tripId, 5, date("2026-10-12"));
  const daySix = await upsertDay(tripId, 6, date("2026-10-13"));

  await prisma.itineraryEvent.createMany({
    data: [
      {
        tripId,
        dayId: dayOne.id,
        title: "Arrive in Marrakesh",
        category: EventCategory.FLIGHT,
        startTime: time(dayOne.date, "14:35"),
        endTime: time(dayOne.date, "15:20"),
        locationName: "Marrakesh Menara Airport",
        latitude: 31.6069,
        longitude: -8.0363,
        notes: "Ask the riad to arrange a private transfer through the medina gate.",
        sortOrder: 0,
      },
      {
        tripId,
        dayId: dayOne.id,
        title: "Check in at Riad Yasmine",
        category: EventCategory.LODGING,
        startTime: time(dayOne.date, "16:30"),
        locationName: "Riad Yasmine",
        latitude: 31.6342,
        longitude: -7.9897,
        notes: "Request courtyard breakfast and rooftop mint tea.",
        sortOrder: 1,
      },
      {
        tripId,
        dayId: dayTwo.id,
        title: "Morning souk walk",
        category: EventCategory.ACTIVITY,
        startTime: time(dayTwo.date, "09:30"),
        endTime: time(dayTwo.date, "12:00"),
        locationName: "Medina of Marrakesh",
        latitude: 31.6295,
        longitude: -7.9811,
        notes: "Leather slippers, ceramics, and a spice stop near Rahba Kedima.",
        sortOrder: 0,
      },
      {
        tripId,
        dayId: dayTwo.id,
        title: "Dinner at Nomad",
        category: EventCategory.FOOD,
        startTime: time(dayTwo.date, "19:30"),
        locationName: "Nomad Marrakech",
        latitude: 31.6307,
        longitude: -7.9868,
        notes: "Rooftop table, sunset if possible.",
        sortOrder: 1,
      },
      {
        tripId,
        dayId: dayThree.id,
        title: "Atlas Mountains day trip",
        category: EventCategory.ACTIVITY,
        startTime: time(dayThree.date, "08:00"),
        endTime: time(dayThree.date, "17:30"),
        locationName: "Imlil",
        latitude: 31.1362,
        longitude: -7.9195,
        notes: "Pack layers and cash for tea stops.",
        sortOrder: 0,
      },
      {
        tripId,
        dayId: dayFour.id,
        title: "Transfer to Essaouira",
        category: EventCategory.TRANSPORT,
        startTime: time(dayFour.date, "10:00"),
        endTime: time(dayFour.date, "13:00"),
        locationName: "Marrakesh to Essaouira",
        notes: "Stop for argan oil cooperative if the driver recommends one.",
        sortOrder: 0,
      },
      {
        tripId,
        dayId: dayFive.id,
        title: "Seafood lunch by the port",
        category: EventCategory.FOOD,
        startTime: time(dayFive.date, "13:00"),
        locationName: "Essaouira Fishing Port",
        latitude: 31.5085,
        longitude: -9.7747,
        notes: "Choose grilled sardines and calamari from the market stalls.",
        sortOrder: 0,
      },
      {
        tripId,
        dayId: daySix.id,
        title: "Return to Marrakesh and fly home",
        category: EventCategory.FLIGHT,
        startTime: time(daySix.date, "09:00"),
        endTime: time(daySix.date, "16:40"),
        locationName: "Marrakesh Menara Airport",
        latitude: 31.6069,
        longitude: -8.0363,
        notes: "Leave Essaouira early enough for airport buffer.",
        sortOrder: 0,
      },
    ],
  });

  console.log("Seeded Phase 2 example trip: Morocco Anniversary Escape.");
} finally {
  await prisma.$disconnect();
}

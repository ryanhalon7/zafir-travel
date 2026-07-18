"use server";

import { EventCategory, TripMemberRole, TripStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signUpSchema = authSchema.extend({
  displayName: z.string().trim().min(1).max(80),
});

const tripSpaceSchema = z.object({
  name: z.string().trim().min(2).max(80),
  destinations: z.string().trim().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  status: z.nativeEnum(TripStatus).default(TripStatus.PLANNING),
});

const inviteSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(6)
    .max(12)
    .transform((value) => value.toUpperCase()),
});

const tripUpdateSchema = tripSpaceSchema.extend({
  tripId: z.string().min(1),
});

const tripIdSchema = z.object({
  tripId: z.string().min(1),
});

const eventSchema = z.object({
  tripId: z.string().min(1),
  dayId: z.string().min(1),
  title: z.string().trim().min(2).max(120),
  category: z.nativeEnum(EventCategory),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  locationName: z.string().trim().max(160).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional().or(z.literal("")),
  longitude: z.coerce.number().min(-180).max(180).optional().or(z.literal("")),
  notes: z.string().trim().max(1200).optional(),
});

const eventUpdateSchema = eventSchema.extend({
  eventId: z.string().min(1),
});

const eventDeleteSchema = z.object({
  tripId: z.string().min(1),
  eventId: z.string().min(1),
});

const reorderSchema = z.object({
  tripId: z.string().min(1),
  dayId: z.string().min(1),
  eventIds: z.string().transform((value) => JSON.parse(value) as string[]),
});

const photoUploadSchema = z.object({
  tripId: z.string().min(1),
  caption: z.string().trim().max(240).optional(),
});

const photoDeleteSchema = z.object({
  tripId: z.string().min(1),
  photoId: z.string().min(1),
});

function withMessage(path: string, message: string) {
  return `${path}?message=${encodeURIComponent(message)}`;
}

async function createInviteCode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
    const existing = await prisma.trip.findUnique({
      where: { inviteCode: code },
      select: { id: true },
    });

    if (!existing) {
      return code;
    }
  }

  throw new Error("Unable to create a unique invite code.");
}

function parseDestinations(value?: string) {
  return (value ?? "")
    .split(",")
    .map((destination) => destination.trim())
    .filter(Boolean);
}

function parseDateInput(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function dateRange(startDate: Date, endDate: Date) {
  const days: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    days.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return days;
}

function timeOnDay(dayDate: Date, value?: string) {
  if (!value) {
    return null;
  }

  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date(dayDate);
  date.setUTCHours(hours, minutes, 0, 0);
  return date;
}

function optionalNumber(value: number | "" | undefined) {
  return value === "" || value === undefined ? null : value;
}

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "");
}

async function requireTripMembership(userId: string, tripId: string) {
  const membership = await prisma.tripMember.findUnique({
    where: {
      tripId_userId: {
        tripId,
        userId,
      },
    },
    select: { id: true },
  });

  if (!membership) {
    redirect("/dashboard");
  }
}

async function syncTripDays(tripId: string, startDate: Date, endDate: Date) {
  const days = dateRange(startDate, endDate);

  await prisma.tripDay.deleteMany({
    where: {
      tripId,
      date: {
        notIn: days,
      },
    },
  });

  await Promise.all(
    days.map((date, index) =>
      prisma.tripDay.upsert({
        where: {
          tripId_date: {
            tripId,
            date,
          },
        },
        update: {
          dayNumber: index + 1,
        },
        create: {
          tripId,
          date,
          dayNumber: index + 1,
        },
      }),
    ),
  );
}

async function uploadCoverPhoto(file: FormDataEntryValue | null, tripId: string, userId: string) {
  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  const supabase = createClient();
  const path = `${userId}/${tripId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from("trip-covers").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("trip-covers").getPublicUrl(path);

  return {
    path,
    publicUrl,
  };
}

export async function signInAction(formData: FormData) {
  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(withMessage("/auth/login", "Enter a valid email and password."));
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect(withMessage("/auth/login", error.message));
  }

  redirect("/dashboard");
}

export async function signUpAction(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(withMessage("/auth/signup", "Enter your name, email, and a password."));
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.displayName,
      },
    },
  });

  if (error) {
    redirect(withMessage("/auth/signup", error.message));
  }

  redirect(withMessage("/auth/login", "Account created. Sign in to continue."));
}

export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

export async function createTripSpaceAction(formData: FormData) {
  const user = await requireUser();
  const parsed = tripSpaceSchema.safeParse({
    name: formData.get("name"),
    destinations: formData.get("destinations"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    status: formData.get("status") || TripStatus.PLANNING,
  });

  if (!parsed.success) {
    redirect(withMessage("/dashboard", "Add a trip name, destination, and dates first."));
  }

  const startDate = parseDateInput(parsed.data.startDate);
  const endDate = parseDateInput(parsed.data.endDate);

  if (endDate < startDate) {
    redirect(withMessage("/dashboard", "End date must be after the start date."));
  }

  const inviteCode = await createInviteCode();

  const trip = await prisma.trip.create({
    data: {
      name: parsed.data.name,
      destinations: parseDestinations(parsed.data.destinations),
      startDate,
      endDate,
      status: parsed.data.status,
      inviteCode,
      createdById: user.id,
      members: {
        create: {
          userId: user.id,
          role: TripMemberRole.OWNER,
        },
      },
    },
  });

  const cover = await uploadCoverPhoto(formData.get("coverPhoto"), trip.id, user.id);

  if (cover) {
    await prisma.trip.update({
      where: { id: trip.id },
      data: {
        coverPhotoPath: cover.path,
        coverPhotoUrl: cover.publicUrl,
      },
    });
  }

  await syncTripDays(trip.id, startDate, endDate);

  revalidatePath("/dashboard");
  redirect(withMessage(`/trips/${trip.id}`, `Invite code: ${inviteCode}`));
}

export async function joinTripSpaceAction(formData: FormData) {
  const user = await requireUser();
  const parsed = inviteSchema.safeParse({
    inviteCode: formData.get("inviteCode"),
  });

  if (!parsed.success) {
    redirect(withMessage("/dashboard", "Enter a valid invite code."));
  }

  const trip = await prisma.trip.findUnique({
    where: { inviteCode: parsed.data.inviteCode },
    include: {
      members: {
        select: { userId: true },
      },
    },
  });

  if (!trip) {
    redirect(withMessage("/dashboard", "That invite code was not found."));
  }

  const alreadyJoined = trip.members.some((member) => member.userId === user.id);

  if (!alreadyJoined && trip.members.length >= 2) {
    redirect(withMessage("/dashboard", "That trip already has two travelers."));
  }

  if (!alreadyJoined) {
    await prisma.tripMember.create({
      data: {
        tripId: trip.id,
        userId: user.id,
        role: TripMemberRole.PARTNER,
      },
    });
  }

  revalidatePath("/dashboard");
  redirect(withMessage("/dashboard", `Joined ${trip.name}.`));
}

export async function updateTripAction(formData: FormData) {
  const user = await requireUser();
  const parsed = tripUpdateSchema.safeParse({
    tripId: formData.get("tripId"),
    name: formData.get("name"),
    destinations: formData.get("destinations"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    status: formData.get("status") || TripStatus.PLANNING,
  });

  if (!parsed.success) {
    redirect(withMessage("/dashboard", "Trip details could not be saved."));
  }

  await requireTripMembership(user.id, parsed.data.tripId);

  const startDate = parseDateInput(parsed.data.startDate);
  const endDate = parseDateInput(parsed.data.endDate);

  if (endDate < startDate) {
    redirect(withMessage(`/trips/${parsed.data.tripId}`, "End date must be after the start date."));
  }

  const cover = await uploadCoverPhoto(formData.get("coverPhoto"), parsed.data.tripId, user.id);

  await prisma.trip.update({
    where: { id: parsed.data.tripId },
    data: {
      name: parsed.data.name,
      destinations: parseDestinations(parsed.data.destinations),
      startDate,
      endDate,
      status: parsed.data.status,
      ...(cover
        ? {
            coverPhotoPath: cover.path,
            coverPhotoUrl: cover.publicUrl,
          }
        : {}),
    },
  });

  await syncTripDays(parsed.data.tripId, startDate, endDate);

  revalidatePath("/dashboard");
  revalidatePath(`/trips/${parsed.data.tripId}`);
  redirect(withMessage(`/trips/${parsed.data.tripId}`, "Trip details saved."));
}

export async function deleteTripAction(formData: FormData) {
  const user = await requireUser();
  const parsed = tripIdSchema.safeParse({
    tripId: formData.get("tripId"),
  });

  if (!parsed.success) {
    redirect(withMessage("/dashboard", "Trip could not be deleted."));
  }

  await requireTripMembership(user.id, parsed.data.tripId);

  await prisma.trip.delete({
    where: { id: parsed.data.tripId },
  });

  revalidatePath("/dashboard");
  redirect(withMessage("/dashboard", "Trip deleted."));
}

export async function createEventAction(formData: FormData) {
  const user = await requireUser();
  const parsed = eventSchema.safeParse({
    tripId: formData.get("tripId"),
    dayId: formData.get("dayId"),
    title: formData.get("title"),
    category: formData.get("category"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    locationName: formData.get("locationName"),
    latitude: formData.get("latitude") || "",
    longitude: formData.get("longitude") || "",
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    redirect(withMessage("/dashboard", "Event could not be created."));
  }

  await requireTripMembership(user.id, parsed.data.tripId);

  const day = await prisma.tripDay.findFirstOrThrow({
    where: {
      id: parsed.data.dayId,
      tripId: parsed.data.tripId,
    },
  });
  const eventCount = await prisma.itineraryEvent.count({
    where: {
      dayId: parsed.data.dayId,
    },
  });

  await prisma.itineraryEvent.create({
    data: {
      tripId: parsed.data.tripId,
      dayId: parsed.data.dayId,
      title: parsed.data.title,
      category: parsed.data.category,
      startTime: timeOnDay(day.date, parsed.data.startTime),
      endTime: timeOnDay(day.date, parsed.data.endTime),
      locationName: parsed.data.locationName || null,
      latitude: optionalNumber(parsed.data.latitude),
      longitude: optionalNumber(parsed.data.longitude),
      notes: parsed.data.notes || null,
      sortOrder: eventCount,
    },
  });

  revalidatePath(`/trips/${parsed.data.tripId}`);
  redirect(withMessage(`/trips/${parsed.data.tripId}`, "Event added."));
}

export async function updateEventAction(formData: FormData) {
  const user = await requireUser();
  const parsed = eventUpdateSchema.safeParse({
    tripId: formData.get("tripId"),
    dayId: formData.get("dayId"),
    eventId: formData.get("eventId"),
    title: formData.get("title"),
    category: formData.get("category"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    locationName: formData.get("locationName"),
    latitude: formData.get("latitude") || "",
    longitude: formData.get("longitude") || "",
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    redirect(withMessage("/dashboard", "Event could not be saved."));
  }

  await requireTripMembership(user.id, parsed.data.tripId);

  const day = await prisma.tripDay.findFirstOrThrow({
    where: {
      id: parsed.data.dayId,
      tripId: parsed.data.tripId,
    },
  });

  await prisma.itineraryEvent.updateMany({
    where: {
      id: parsed.data.eventId,
      tripId: parsed.data.tripId,
      dayId: parsed.data.dayId,
    },
    data: {
      title: parsed.data.title,
      category: parsed.data.category,
      startTime: timeOnDay(day.date, parsed.data.startTime),
      endTime: timeOnDay(day.date, parsed.data.endTime),
      locationName: parsed.data.locationName || null,
      latitude: optionalNumber(parsed.data.latitude),
      longitude: optionalNumber(parsed.data.longitude),
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath(`/trips/${parsed.data.tripId}`);
  redirect(withMessage(`/trips/${parsed.data.tripId}`, "Event saved."));
}

export async function deleteEventAction(formData: FormData) {
  const user = await requireUser();
  const parsed = eventDeleteSchema.safeParse({
    tripId: formData.get("tripId"),
    eventId: formData.get("eventId"),
  });

  if (!parsed.success) {
    redirect(withMessage("/dashboard", "Event could not be deleted."));
  }

  await requireTripMembership(user.id, parsed.data.tripId);

  await prisma.itineraryEvent.deleteMany({
    where: {
      id: parsed.data.eventId,
      tripId: parsed.data.tripId,
    },
  });

  revalidatePath(`/trips/${parsed.data.tripId}`);
  redirect(withMessage(`/trips/${parsed.data.tripId}`, "Event deleted."));
}

export async function reorderEventsAction(formData: FormData) {
  const user = await requireUser();
  const parsed = reorderSchema.safeParse({
    tripId: formData.get("tripId"),
    dayId: formData.get("dayId"),
    eventIds: formData.get("eventIds"),
  });

  if (!parsed.success) {
    return;
  }

  await requireTripMembership(user.id, parsed.data.tripId);

  await prisma.$transaction(
    parsed.data.eventIds.map((eventId, index) =>
      prisma.itineraryEvent.updateMany({
        where: {
          id: eventId,
          tripId: parsed.data.tripId,
          dayId: parsed.data.dayId,
        },
        data: {
          sortOrder: index,
        },
      }),
    ),
  );

  revalidatePath(`/trips/${parsed.data.tripId}`);
}

export async function uploadTripPhotosAction(formData: FormData) {
  const user = await requireUser();
  const parsed = photoUploadSchema.safeParse({
    tripId: formData.get("tripId"),
    caption: formData.get("caption") || undefined,
  });

  if (!parsed.success) {
    redirect(withMessage("/dashboard", "Photos could not be uploaded."));
  }

  await requireTripMembership(user.id, parsed.data.tripId);

  const files = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0 || files.length > 12) {
    redirect(withMessage(`/trips/${parsed.data.tripId}`, "Choose between 1 and 12 photos."));
  }

  const invalidFile = files.find(
    (file) => !file.type.startsWith("image/") || file.size > 12 * 1024 * 1024,
  );

  if (invalidFile) {
    redirect(withMessage(`/trips/${parsed.data.tripId}`, "Each photo must be an image under 12 MB."));
  }

  const supabase = createClient();
  const uploadedPaths: string[] = [];

  try {
    for (const file of files) {
      const storagePath = `${parsed.data.tripId}/${user.id}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
      const { error } = await supabase.storage.from("trip-photos").upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

      if (error) {
        throw new Error(error.message);
      }

      uploadedPaths.push(storagePath);
      await prisma.tripPhoto.create({
        data: {
          tripId: parsed.data.tripId,
          uploaderId: user.id,
          storagePath,
          fileName: file.name,
          caption: parsed.data.caption || null,
        },
      });
    }
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from("trip-photos").remove(uploadedPaths);
      await prisma.tripPhoto.deleteMany({ where: { storagePath: { in: uploadedPaths } } });
    }
    redirect(
      withMessage(
        `/trips/${parsed.data.tripId}`,
        error instanceof Error ? error.message : "Photos could not be uploaded.",
      ),
    );
  }

  revalidatePath(`/trips/${parsed.data.tripId}`);
  redirect(withMessage(`/trips/${parsed.data.tripId}`, `${files.length} photo${files.length === 1 ? "" : "s"} added.`));
}

export async function deleteTripPhotoAction(formData: FormData) {
  const user = await requireUser();
  const parsed = photoDeleteSchema.safeParse({
    tripId: formData.get("tripId"),
    photoId: formData.get("photoId"),
  });

  if (!parsed.success) {
    redirect(withMessage("/dashboard", "Photo could not be deleted."));
  }

  await requireTripMembership(user.id, parsed.data.tripId);
  const photo = await prisma.tripPhoto.findFirst({
    where: { id: parsed.data.photoId, tripId: parsed.data.tripId },
    select: { id: true, storagePath: true },
  });

  if (!photo) {
    redirect(withMessage(`/trips/${parsed.data.tripId}`, "Photo was not found."));
  }

  const supabase = createClient();
  const { error } = await supabase.storage.from("trip-photos").remove([photo.storagePath]);

  if (error) {
    redirect(withMessage(`/trips/${parsed.data.tripId}`, error.message));
  }

  await prisma.tripPhoto.delete({ where: { id: photo.id } });
  revalidatePath(`/trips/${parsed.data.tripId}`);
  redirect(withMessage(`/trips/${parsed.data.tripId}`, "Photo deleted."));
}

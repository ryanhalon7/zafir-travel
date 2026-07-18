"use server";

import { TripMemberRole } from "@prisma/client";
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
});

const inviteSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(6)
    .max(12)
    .transform((value) => value.toUpperCase()),
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
  });

  if (!parsed.success) {
    redirect(withMessage("/dashboard", "Name the shared trip space first."));
  }

  const inviteCode = await createInviteCode();

  await prisma.trip.create({
    data: {
      name: parsed.data.name,
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

  revalidatePath("/dashboard");
  redirect(withMessage("/dashboard", `Invite code: ${inviteCode}`));
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

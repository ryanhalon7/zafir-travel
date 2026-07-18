import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function getSessionUser() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    return error ? null : user;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getSessionUser();

  if (!user?.email) {
    redirect("/auth/login");
  }

  await prisma.user.upsert({
    where: { id: user.id },
    update: {
      email: user.email,
      displayName: user.user_metadata?.display_name ?? null,
    },
    create: {
      id: user.id,
      email: user.email,
      displayName: user.user_metadata?.display_name ?? null,
    },
  });

  return user;
}

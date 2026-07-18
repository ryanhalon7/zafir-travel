import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function getSessionUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
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

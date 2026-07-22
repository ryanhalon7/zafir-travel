import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AppShell } from "@/components/shell/app-shell";
import { PhotoUploadForm } from "@/components/trips/photo-upload-form";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AddPhotosPageProps = {
  params: { tripId: string };
  searchParams?: { message?: string };
};

export default async function AddPhotosPage({ params, searchParams }: AddPhotosPageProps) {
  const user = await requireUser();
  const trip = await prisma.trip.findFirst({
    where: { id: params.tripId, members: { some: { userId: user.id } } },
    select: {
      id: true,
      days: { orderBy: { dayNumber: "asc" }, select: { id: true, dayNumber: true, date: true } },
    },
  });

  if (!trip) notFound();

  const days = trip.days.map((day) => ({
    id: day.id,
    dayNumber: day.dayNumber,
    dateLabel: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(day.date),
  }));

  return (
    <AppShell userEmail={user.email ?? ""} tripId={trip.id} hideMobileHeader>
      <div className="mx-auto -mt-4 max-w-2xl md:mt-0">
        <header className="mb-5 flex items-center gap-4 border-b border-burgundy/10 pb-4">
          <Link href={`/trips/${trip.id}?tab=photos`} className="inline-flex items-center gap-1 text-sm font-semibold text-espresso/75 hover:text-terracotta"><ArrowLeft className="h-4 w-4" /> Back</Link>
          <h1 className="font-heading text-2xl text-espresso md:text-3xl">Upload Photos</h1>
        </header>
        {searchParams?.message ? <p className="mb-4 rounded-xl bg-terracotta/10 px-4 py-3 text-sm font-semibold text-terracotta">{searchParams.message}</p> : null}
        {days.length === 0 ? <p className="rounded-xl bg-ivory p-6 text-sm text-espresso/65">Add trip dates before uploading photos.</p> : <PhotoUploadForm tripId={trip.id} days={days} />}
      </div>
    </AppShell>
  );
}

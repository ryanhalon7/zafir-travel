import Link from "next/link";
import { CalendarDays, Copy, MapPin, Plus, UsersRound } from "lucide-react";

import { createTripSpaceAction, joinTripSpaceAction } from "@/app/actions";
import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/date-format";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type DashboardPageProps = {
  searchParams?: {
    message?: string;
  };
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireUser();
  const trips = await prisma.trip.findMany({
    where: {
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <AppShell userEmail={user.email ?? ""}>
      <section className="mb-9 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div className="animate-fade-up">
          <Badge variant="gold">Private planning</Badge>
          <h1 className="mt-5 max-w-3xl font-heading text-5xl leading-none text-burgundy sm:text-6xl">
            Your shared trips
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-espresso/70">
            Create a private planning space, share the invite code, and keep both
            travelers attached to the same trip record from the beginning.
          </p>
        </div>
        {searchParams?.message ? (
          <div className="rounded-lg bg-ivory/80 px-5 py-4 text-sm font-semibold text-espresso shadow-soft">
            {searchParams.message}
          </div>
        ) : null}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Plus className="h-5 w-5 text-terracotta" aria-hidden="true" />
              Create a trip
            </CardTitle>
            <CardDescription>
              Add the essentials now; the day-by-day itinerary opens after creation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createTripSpaceAction} className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Trip name</Label>
                <Input id="name" name="name" placeholder="Morocco anniversary escape" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destinations">Destination(s)</Label>
                <Textarea
                  id="destinations"
                  name="destinations"
                  placeholder="Marrakesh, Essaouira"
                  required
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start date</Label>
                  <Input id="startDate" name="startDate" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End date</Label>
                  <Input id="endDate" name="endDate" type="date" required />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_1.15fr]">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <NativeSelect id="status" name="status" defaultValue="PLANNING">
                    <option value="PLANNING">Planning</option>
                    <option value="UPCOMING">Upcoming</option>
                    <option value="ACTIVE">Active</option>
                    <option value="PAST">Past</option>
                  </NativeSelect>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coverPhoto">Cover photo</Label>
                  <FileUpload
                    id="coverPhoto"
                    name="coverPhoto"
                    accept="image/*"
                    buttonText="Choose cover"
                  />
                </div>
              </div>
              <Button className="w-full sm:w-fit" type="submit">
                Create
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <UsersRound className="h-5 w-5 text-terracotta" aria-hidden="true" />
              Join with a code
            </CardTitle>
            <CardDescription>
              Enter the invite code from your travel partner to join their trip.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={joinTripSpaceAction} className="flex flex-col gap-3 sm:flex-row">
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor="inviteCode">Invite code</Label>
                <Input
                  id="inviteCode"
                  name="inviteCode"
                  placeholder="A1B2C3D4"
                  className="uppercase"
                  required
                />
              </div>
              <Button className="mt-auto" type="submit" variant="secondary">
                Join
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="mt-8">
        {trips.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {trips.map((trip) => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="group block rounded-lg active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-gold focus-visible:ring-offset-2"
                aria-label={`Open ${trip.name}`}
              >
              <Card className="h-full overflow-hidden transition duration-200 group-hover:-translate-y-1 group-hover:shadow-luxe">
                <div
                  className="h-32 bg-cover bg-center"
                  style={{
                    backgroundImage: `linear-gradient(135deg, rgba(184,93,59,0.76), rgba(95,22,38,0.72)), url('${
                      trip.coverPhotoUrl ??
                      "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1000&q=80"
                    }')`,
                  }}
                />
                <CardHeader>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <Badge>{trip.members.length}/2 travelers</Badge>
                    <span className="text-xs font-semibold uppercase text-espresso/45">
                      {trip.inviteCode}
                    </span>
                  </div>
                  <CardTitle className="transition group-hover:text-wine">{trip.name}</CardTitle>
                  <CardDescription>
                    {trip.members.map((member) => member.user.email).join(" + ")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-espresso/65">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-terracotta" aria-hidden="true" />
                    {trip.destinations.length > 0 ? trip.destinations.join(", ") : "Destinations pending"}
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-terracotta" aria-hidden="true" />
                      {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                    </span>
                    <span className="flex items-center gap-2 font-semibold text-burgundy">
                      <Copy className="h-4 w-4" aria-hidden="true" />
                      Invite
                    </span>
                  </div>
                  <span className="inline-flex w-full items-center justify-center rounded-full border border-burgundy/20 px-5 py-2.5 font-semibold text-burgundy transition group-hover:bg-burgundy group-hover:text-ivory">
                    Open trip
                  </span>
                </CardContent>
              </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-ivory/70 px-6 py-12 text-center shadow-soft">
            <h2 className="font-heading text-3xl text-burgundy">No trips yet</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-espresso/65">
              Start a shared planning space or join one with your partner&apos;s invite code.
            </p>
          </div>
        )}
      </section>
    </AppShell>
  );
}

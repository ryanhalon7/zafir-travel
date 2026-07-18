import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Trash2, UsersRound } from "lucide-react";

import { deleteTripAction, updateTripAction } from "@/app/actions";
import { AppShell } from "@/components/shell/app-shell";
import { TripPlanner } from "@/components/trips/trip-planner";
import { PhotoGallery } from "@/components/trips/photo-gallery";
import { BudgetBoard } from "@/components/trips/budget-board";
import { PackingList } from "@/components/trips/packing-list";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { dateInputValue, formatDate, timeInputValue } from "@/lib/date-format";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

type TripPageProps = {
  params: {
    tripId: string;
  };
  searchParams?: {
    message?: string;
  };
};

function statusLabel(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default async function TripPage({ params, searchParams }: TripPageProps) {
  const user = await requireUser();
  const trip = await prisma.trip.findFirst({
    where: {
      id: params.tripId,
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
      days: {
        include: {
          events: {
            orderBy: [
              {
                sortOrder: "asc",
              },
              {
                startTime: "asc",
              },
            ],
          },
        },
        orderBy: {
          dayNumber: "asc",
        },
      },
      photos: {
        include: {
          uploader: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      expenses: {
        include: {
          payer: true,
        },
        orderBy: [
          { expenseDate: "desc" },
          { createdAt: "desc" },
        ],
      },
      packingItems: {
        include: {
          assignedTo: true,
        },
        orderBy: [
          { category: "asc" },
          { createdAt: "asc" },
        ],
      },
    },
  });

  if (!trip) {
    notFound();
  }

  const days = trip.days.map((day) => ({
    id: day.id,
    dayNumber: day.dayNumber,
    date: day.date.toISOString().slice(0, 10),
    dateLabel: formatDate(day.date),
    events: day.events.map((event) => ({
      id: event.id,
      title: event.title,
      category: event.category,
      startTime: timeInputValue(event.startTime),
      endTime: timeInputValue(event.endTime),
      locationName: event.locationName ?? "",
      latitude: event.latitude,
      longitude: event.longitude,
      notes: event.notes ?? "",
    })),
  }));

  const supabase = createClient();
  const photos = await Promise.all(
    trip.photos.map(async (photo) => {
      const { data } = await supabase.storage
        .from("trip-photos")
        .createSignedUrl(photo.storagePath, 60 * 60);

      return {
        id: photo.id,
        url: data?.signedUrl ?? "",
        fileName: photo.fileName,
        caption: photo.caption ?? "",
        uploaderName: photo.uploader.displayName ?? photo.uploader.email,
        createdAt: formatDate(photo.createdAt),
      };
    }),
  );
  const budgetMembers = trip.members.map((member) => ({
    id: member.userId,
    name: member.user.displayName ?? member.user.email,
  }));
  const expenses = trip.expenses.map((expense) => ({
    id: expense.id,
    title: expense.title,
    amount: expense.amount.toNumber(),
    category: expense.category,
    expenseDate: expense.expenseDate.toISOString().slice(0, 10),
    dateLabel: formatDate(expense.expenseDate),
    notes: expense.notes ?? "",
    payerId: expense.payerId,
    payerName: expense.payer.displayName ?? expense.payer.email,
  }));
  const packingItems = trip.packingItems.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    category: item.category,
    assignedToId: item.assignedToId ?? "",
    assignedToName: item.assignedTo?.displayName ?? item.assignedTo?.email ?? "",
    notes: item.notes ?? "",
    isPacked: item.isPacked,
  }));

  return (
    <AppShell userEmail={user.email ?? ""}>
      <div className="mb-6">
        <Button asChild variant="ghost">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to trips
          </Link>
        </Button>
      </div>

      <section
        className="relative overflow-hidden rounded-lg bg-cover bg-center px-6 py-14 text-ivory shadow-luxe sm:px-9 lg:py-20"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(51,37,31,0.82), rgba(95,22,38,0.34)), url('${
            trip.coverPhotoUrl ??
            "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80"
          }')`,
        }}
      >
        <div className="relative max-w-3xl">
          <Badge variant="gold">{statusLabel(trip.status)}</Badge>
          <h1 className="mt-5 font-heading text-5xl leading-none sm:text-6xl lg:text-7xl">
            {trip.name}
          </h1>
          <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold text-ivory/85">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-gold" />
              {trip.destinations.length > 0 ? trip.destinations.join(", ") : "Destinations pending"}
            </span>
            <span className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-gold" />
              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
            </span>
            <span className="flex items-center gap-2">
              <UsersRound className="h-4 w-4 text-muted-gold" />
              {trip.members.length}/2 travelers
            </span>
          </div>
        </div>
      </section>

      {searchParams?.message ? (
        <div className="mt-5 rounded-lg bg-ivory/80 px-5 py-4 text-sm font-semibold text-espresso shadow-soft">
          {searchParams.message}
        </div>
      ) : null}

      <Tabs defaultValue="itinerary" className="mt-8">
        <TabsList>
          <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="packing">Packing</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="itinerary">
          <TripPlanner days={days} tripId={trip.id} />
        </TabsContent>

        <TabsContent value="details">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Edit trip</CardTitle>
                <CardDescription>
                  Dates control the itinerary days. Shortening a trip removes days outside the new range.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={updateTripAction} className="grid gap-4">
                  <input name="tripId" type="hidden" value={trip.id} />
                  <div className="space-y-2">
                    <Label htmlFor="name">Trip name</Label>
                    <Input id="name" name="name" defaultValue={trip.name} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destinations">Destination(s)</Label>
                    <Textarea
                      id="destinations"
                      name="destinations"
                      defaultValue={trip.destinations.join(", ")}
                      required
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start date</Label>
                      <Input
                        id="startDate"
                        name="startDate"
                        type="date"
                        defaultValue={dateInputValue(trip.startDate)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End date</Label>
                      <Input
                        id="endDate"
                        name="endDate"
                        type="date"
                        defaultValue={dateInputValue(trip.endDate)}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_1.15fr]">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <NativeSelect id="status" name="status" defaultValue={trip.status}>
                        <option value="PLANNING">Planning</option>
                        <option value="UPCOMING">Upcoming</option>
                        <option value="ACTIVE">Active</option>
                        <option value="PAST">Past</option>
                      </NativeSelect>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coverPhoto">Replace cover photo</Label>
                      <FileUpload
                        id="coverPhoto"
                        name="coverPhoto"
                        accept="image/*"
                        buttonText="Choose new cover"
                      />
                    </div>
                  </div>
                  <Button className="w-full sm:w-fit" type="submit">
                    Save trip
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shared access</CardTitle>
                <CardDescription>
                  Share this code with the second traveler to pair their account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-lg bg-sand/60 px-5 py-4">
                  <p className="text-xs font-semibold uppercase text-espresso/50">Invite code</p>
                  <p className="mt-2 font-heading text-4xl text-burgundy">{trip.inviteCode}</p>
                </div>
                <div className="space-y-2 text-sm text-espresso/70">
                  {trip.members.map((member) => (
                    <p key={member.id}>{member.user.email}</p>
                  ))}
                </div>
                <form action={deleteTripAction}>
                  <input name="tripId" type="hidden" value={trip.id} />
                  <Button type="submit" variant="outline">
                    <Trash2 className="h-4 w-4" />
                    Delete trip
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="photos">
          <PhotoGallery tripId={trip.id} photos={photos.filter((photo) => photo.url)} />
        </TabsContent>
        <TabsContent value="budget">
          <BudgetBoard
            tripId={trip.id}
            budgetAmount={trip.budgetAmount?.toNumber() ?? null}
            currency={trip.currency}
            members={budgetMembers}
            expenses={expenses}
          />
        </TabsContent>
        <TabsContent value="packing">
          <PackingList tripId={trip.id} members={budgetMembers} items={packingItems} />
        </TabsContent>
        <TabsContent value="documents">
          <StubCard title="Documents" copy="The document vault arrives in Phase 7." />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function StubCard({ title, copy }: { title: string; copy: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{copy}</CardDescription>
      </CardHeader>
    </Card>
  );
}

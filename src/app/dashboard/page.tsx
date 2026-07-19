import { joinTripSpaceAction } from "@/app/actions";
import { AppShell } from "@/components/shell/app-shell";
import { TripsDashboard, type DashboardTrip } from "@/components/trips/trips-dashboard";
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
      expenses: {
        select: {
          amount: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const dashboardTrips: DashboardTrip[] = trips.map((trip) => ({
    id: trip.id,
    name: trip.name,
    destinations: trip.destinations,
    startDate: trip.startDate?.toISOString() ?? null,
    endDate: trip.endDate?.toISOString() ?? null,
    coverPhotoUrl: trip.coverPhotoUrl,
    budgetAmount: trip.budgetAmount?.toNumber() ?? null,
    spentAmount: trip.expenses.reduce((total, expense) => total + expense.amount.toNumber(), 0),
    currency: trip.currency,
    status: trip.status,
    travelers: trip.members.map((member) => ({
      id: member.user.id,
      name: member.user.displayName ?? member.user.email,
    })),
  }));

  const travelerNames = Array.from(
    new Map(
      trips
        .flatMap((trip) => trip.members)
        .map((member) => [
          member.user.id,
          member.user.displayName ?? member.user.email.split("@")[0],
        ]),
    ).values(),
  ).slice(0, 2);

  return (
    <AppShell
      userEmail={user.email ?? ""}
      tripId={trips[0]?.id}
      hideMobileHeader
    >
      <TripsDashboard
        trips={dashboardTrips}
        travelerNames={travelerNames}
        message={searchParams?.message}
        joinTripAction={joinTripSpaceAction}
      />
    </AppShell>
  );
}

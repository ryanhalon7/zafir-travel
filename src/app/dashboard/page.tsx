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

  const now = Date.now();
  const sortedTrips = [...trips].sort((a, b) => {
    const dateDifference = distanceFromNow(a.startDate, now) - distanceFromNow(b.startDate, now);
    return dateDifference || b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  const dashboardTrips: DashboardTrip[] = sortedTrips.map((trip) => ({
    id: trip.id,
    inviteCode: trip.inviteCode,
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
      sortedTrips
        .flatMap((trip) => trip.members)
        .map((member) => [
          member.user.id,
          member.user.displayName ?? member.user.email.split("@")[0],
        ]),
    ).values(),
  ).slice(0, 2);
  const activeTrip = selectDefaultTrip(trips);

  return (
    <AppShell
      userEmail={user.email ?? ""}
      tripId={activeTrip?.id}
      hideMobileHeader
      travelerNames={travelerNames}
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

function selectDefaultTrip<T extends { startDate: Date | null; status: string; updatedAt: Date }>(trips: T[]) {
  const now = Date.now();

  return [...trips].sort((a, b) => {
    const statusDifference = statusPriority(a.status) - statusPriority(b.status);
    if (statusDifference !== 0) return statusDifference;

    const dateDifference = distanceFromNow(a.startDate, now) - distanceFromNow(b.startDate, now);
    if (dateDifference !== 0) return dateDifference;

    return b.updatedAt.getTime() - a.updatedAt.getTime();
  })[0];
}

function statusPriority(status: string) {
  if (status === "ACTIVE") return 0;
  if (status === "UPCOMING") return 1;
  if (status === "PLANNING") return 2;
  return 3;
}

function distanceFromNow(startDate: Date | null, now: number) {
  return startDate ? Math.abs(startDate.getTime() - now) : Number.POSITIVE_INFINITY;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Plus, Search, TicketCheck, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type TripStatus = "PLANNING" | "UPCOMING" | "ACTIVE" | "PAST";

export type DashboardTrip = {
  id: string;
  name: string;
  destinations: string[];
  startDate: string | null;
  endDate: string | null;
  coverPhotoUrl: string | null;
  budgetAmount: number | null;
  spentAmount: number;
  currency: string;
  status: TripStatus;
  travelers: Array<{ id: string; name: string }>;
};

type TripsDashboardProps = {
  trips: DashboardTrip[];
  travelerNames: string[];
  message?: string;
  joinTripAction: (formData: FormData) => void | Promise<void>;
};

const filters: Array<{ label: string; value: "ALL" | TripStatus }> = [
  { label: "All", value: "ALL" },
  { label: "Planning", value: "PLANNING" },
  { label: "Upcoming", value: "UPCOMING" },
  { label: "Active", value: "ACTIVE" },
  { label: "Past", value: "PAST" },
];

const fallbackCover =
  "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1200&q=80";

export function TripsDashboard({
  trips,
  travelerNames,
  message,
  joinTripAction,
}: TripsDashboardProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | TripStatus>("ALL");

  useEffect(() => {
    document.documentElement.classList.add("dashboard-hide-scrollbars");
    return () => document.documentElement.classList.remove("dashboard-hide-scrollbars");
  }, []);

  const visibleTrips = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return trips.filter((trip) => {
      const matchesStatus = filter === "ALL" || trip.status === filter;
      const matchesQuery =
        !normalizedQuery ||
        trip.name.toLowerCase().includes(normalizedQuery) ||
        trip.destinations.some((destination) =>
          destination.toLowerCase().includes(normalizedQuery),
        );

      return matchesStatus && matchesQuery;
    });
  }, [filter, query, trips]);

  const travelerLabel =
    travelerNames.length > 0 ? travelerNames.join(" & ") : "Your private collection";

  return (
    <div className="mx-auto max-w-6xl animate-fade-up">
      <section className="flex items-start justify-between gap-5">
        <div className="min-w-0">
          <h1 className="font-heading text-4xl leading-none text-burgundy sm:text-5xl">
            Our Trips
          </h1>
          <p className="mt-3 truncate text-sm text-espresso/60 sm:text-base">
            {travelerLabel} · {trips.length} {trips.length === 1 ? "adventure" : "adventures"}
          </p>
        </div>
        <div className="flex shrink-0 -space-x-2" aria-label={travelerLabel}>
          {(travelerNames.length > 0 ? travelerNames : ["Zafir"]).map((name, index) => (
            <span
              key={`${name}-${index}`}
              title={name}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 border-ivory text-sm font-bold text-ivory shadow-soft",
                index % 2 === 0 ? "bg-terracotta" : "bg-burgundy",
              )}
            >
              {initials(name)}
            </span>
          ))}
        </div>
      </section>

      {message ? (
        <div
          role="status"
          className="mt-6 rounded-2xl border border-muted-gold/25 bg-ivory/85 px-5 py-4 text-sm font-semibold text-espresso shadow-soft"
        >
          {message}
        </div>
      ) : null}

      <section className="mt-7" aria-label="Find trips">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-terracotta"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search trips..."
            aria-label="Search trips"
            className="h-12 rounded-2xl bg-ivory/90 pl-12 text-base shadow-soft"
          />
        </div>

        <div
          className="hide-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
          aria-label="Filter trips by status"
        >
          {filters.map((item) => {
            const active = filter === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                aria-pressed={active}
                className={cn(
                  "min-h-10 shrink-0 rounded-full border px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-gold",
                  active
                    ? "border-terracotta bg-terracotta text-ivory shadow-soft"
                    : "border-burgundy/15 bg-ivory/60 text-espresso/65 hover:border-terracotta/40 hover:text-burgundy",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-7" aria-live="polite">
        {visibleTrips.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-burgundy/10 bg-ivory/70 px-6 py-12 text-center shadow-soft">
            <CalendarDays className="mx-auto h-8 w-8 text-terracotta" aria-hidden="true" />
            <h2 className="mt-4 font-heading text-3xl text-burgundy">
              {trips.length === 0 ? "Your first adventure awaits" : "No matching trips"}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-espresso/60">
              {trips.length === 0
                ? "Create a trip or join your travel partner with an invite code."
                : "Try another search or status filter."}
            </p>
          </div>
        )}
      </section>

      <details className="group mt-7 rounded-3xl border border-burgundy/10 bg-ivory/65 shadow-soft">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-sm font-semibold text-burgundy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-gold">
          <UsersRound className="h-5 w-5 text-terracotta" aria-hidden="true" />
          Have an invite code?
          <span className="ml-auto text-xs font-medium text-espresso/45 group-open:hidden">
            Join a trip
          </span>
        </summary>
        <form action={joinTripAction} className="flex flex-col gap-3 border-t border-burgundy/10 p-5 sm:flex-row">
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
            <TicketCheck className="h-4 w-4" aria-hidden="true" />
            Join trip
          </Button>
        </form>
      </details>

      <Button
        asChild
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-40 h-14 rounded-full px-6 shadow-luxe md:bottom-8 md:right-8"
      >
        <Link href="/trips/new">
          <Plus className="h-5 w-5" aria-hidden="true" />
          New Trip
        </Link>
      </Button>
    </div>
  );
}

function TripCard({ trip }: { trip: DashboardTrip }) {
  const dates = formatDateRange(trip.startDate, trip.endDate);
  const duration = tripDuration(trip.startDate, trip.endDate);
  const budgetPercent = trip.budgetAmount
    ? Math.min(100, Math.max(0, (trip.spentAmount / trip.budgetAmount) * 100))
    : 0;

  return (
    <Link
      href={`/trips/${trip.id}`}
      aria-label={`Open ${trip.name}`}
      className="group block overflow-hidden rounded-3xl bg-ivory shadow-soft transition duration-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-gold focus-visible:ring-offset-2 md:hover:-translate-y-1 md:hover:shadow-luxe"
    >
      <div
        className="relative flex min-h-52 flex-col justify-between bg-cover bg-center p-4 text-ivory"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(51,37,31,0.08) 15%, rgba(51,37,31,0.84) 100%), url('${trip.coverPhotoUrl ?? fallbackCover}')`,
        }}
      >
        <span className="w-fit rounded-full bg-ivory/90 px-3 py-1 text-xs font-bold text-terracotta shadow-soft backdrop-blur">
          {statusLabel(trip.status)}
        </span>
        <div>
          <h2 className="font-heading text-3xl leading-tight drop-shadow-sm">{trip.name}</h2>
          <p className="mt-1 text-sm font-semibold text-ivory/85">
            {trip.destinations.length > 0
              ? trip.destinations.join(", ")
              : "Destination pending"}
          </p>
        </div>
      </div>

      <div className="space-y-4 p-4 text-sm text-espresso/60">
        <div className="flex items-start justify-between gap-4">
          <span>{dates}</span>
          <span className="shrink-0">{duration}</span>
        </div>

        {trip.status === "PAST" ? (
          <div className="flex items-center justify-between gap-3 border-t border-burgundy/8 pt-3">
            <span>{formatMoney(trip.spentAmount, trip.currency)} spent</span>
            <span>{trip.travelers.length} travelers</span>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between gap-3">
              <span>Budget</span>
              <span className="font-semibold text-espresso">
                {trip.budgetAmount
                  ? `${formatMoney(trip.spentAmount, trip.currency)} of ${formatMoney(trip.budgetAmount, trip.currency)}`
                  : "Not set"}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand/70">
              <span
                className="block h-full rounded-full bg-terracotta transition-all"
                style={{ width: `${budgetPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

function statusLabel(status: TripStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDateRange(startDate: string | null, endDate: string | null) {
  if (!startDate || !endDate) return "Dates not set";
  const formatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${formatter.format(new Date(startDate))} – ${formatter.format(new Date(endDate))}`;
}

function tripDuration(startDate: string | null, endDate: string | null) {
  if (!startDate || !endDate) return "Flexible";
  const days = Math.max(
    1,
    Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000),
  );
  return `${days} ${days === 1 ? "day" : "days"}`;
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

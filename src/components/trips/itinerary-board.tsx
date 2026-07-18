"use client";

import { useMemo, useState, useTransition } from "react";
import { Clock, GripVertical, MapPin, Pencil, Plus, Trash2 } from "lucide-react";

import {
  createEventAction,
  deleteEventAction,
  reorderEventsAction,
  updateEventAction,
} from "@/app/actions";
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
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type EventItem = {
  id: string;
  title: string;
  category: string;
  startTime: string;
  endTime: string;
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  notes: string;
};

export type DayItem = {
  id: string;
  dayNumber: number;
  date: string;
  dateLabel: string;
  events: EventItem[];
};

type ItineraryBoardProps = {
  tripId: string;
  days: DayItem[];
  selectedEventId?: string | null;
  onSelectEvent?: (eventId: string, dayId: string) => void;
};

const categories = [
  ["FLIGHT", "Flight"],
  ["LODGING", "Lodging"],
  ["ACTIVITY", "Activity"],
  ["FOOD", "Food"],
  ["TRANSPORT", "Transport"],
];

function categoryLabel(category: string) {
  return categories.find(([value]) => value === category)?.[1] ?? category;
}

function moveItem(items: EventItem[], fromId: string, toId: string) {
  const next = [...items];
  const fromIndex = next.findIndex((item) => item.id === fromId);
  const toIndex = next.findIndex((item) => item.id === toId);

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return items;
  }

  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function ItineraryBoard({
  tripId,
  days,
  selectedEventId,
  onSelectEvent,
}: ItineraryBoardProps) {
  const [orderedDays, setOrderedDays] = useState(days);
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [draggedDayId, setDraggedDayId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const eventCounts = useMemo(
    () => orderedDays.reduce((count, day) => count + day.events.length, 0),
    [orderedDays],
  );

  function persistOrder(dayId: string, events: EventItem[]) {
    const formData = new FormData();
    formData.set("tripId", tripId);
    formData.set("dayId", dayId);
    formData.set("eventIds", JSON.stringify(events.map((event) => event.id)));

    startTransition(() => {
      void reorderEventsAction(formData);
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-3xl text-burgundy">Day-by-day itinerary</h2>
          <p className="mt-2 text-sm text-espresso/65">
            {eventCounts} scheduled {eventCounts === 1 ? "event" : "events"} across {orderedDays.length} days.
          </p>
        </div>
        <Badge variant="gold">Drag within a day</Badge>
      </div>

      {orderedDays.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Dates needed</CardTitle>
            <CardDescription>
              Add trip dates in the details tab to create itinerary days.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        orderedDays.map((day) => (
          <Card key={day.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Badge>Day {day.dayNumber}</Badge>
                  <CardTitle className="mt-3">{day.dateLabel}</CardTitle>
                </div>
                <details className="group">
                  <summary className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-burgundy px-4 py-2 text-sm font-semibold text-ivory shadow-soft transition hover:bg-wine">
                    <Plus className="h-4 w-4" />
                    Add event
                  </summary>
                  <div className="mt-4 w-full min-w-[min(82vw,520px)] rounded-lg bg-sand/45 p-4 shadow-inner-soft">
                    <EventForm tripId={tripId} dayId={day.id} />
                  </div>
                </details>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {day.events.length === 0 ? (
                <div className="rounded-lg bg-cream/75 px-5 py-8 text-sm text-espresso/60">
                  Nothing scheduled yet.
                </div>
              ) : (
                day.events.map((event) => (
                  <article
                    key={event.id}
                    id={`itinerary-event-${event.id}`}
                    draggable
                    onClick={() => onSelectEvent?.(event.id, day.id)}
                    onDragStart={() => {
                      setDraggedEventId(event.id);
                      setDraggedDayId(day.id);
                    }}
                    onDragOver={(currentEvent) => currentEvent.preventDefault()}
                    onDrop={() => {
                      if (!draggedEventId || draggedDayId !== day.id) {
                        return;
                      }

                      const nextDays = orderedDays.map((orderedDay) => {
                        if (orderedDay.id !== day.id) {
                          return orderedDay;
                        }

                        return {
                          ...orderedDay,
                          events: moveItem(orderedDay.events, draggedEventId, event.id),
                        };
                      });
                      const nextDay = nextDays.find((orderedDay) => orderedDay.id === day.id);

                      setOrderedDays(nextDays);
                      setDraggedEventId(null);
                      setDraggedDayId(null);

                      if (nextDay) {
                        persistOrder(day.id, nextDay.events);
                      }
                    }}
                    className={cn(
                      "cursor-pointer rounded-lg bg-ivory p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-luxe",
                      draggedEventId === event.id && "opacity-50",
                      selectedEventId === event.id && "ring-2 ring-muted-gold shadow-luxe",
                    )}
                  >
                    <div className="flex gap-3">
                      <button
                        className="mt-1 flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-full bg-sand text-burgundy"
                        type="button"
                        aria-label="Drag to reorder"
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <Badge>{categoryLabel(event.category)}</Badge>
                            <h3 className="mt-2 font-heading text-2xl text-burgundy">
                              {event.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 text-sm font-semibold text-espresso/65">
                            {event.startTime || event.endTime ? (
                              <>
                                <Clock className="h-4 w-4 text-terracotta" />
                                <span>
                                  {event.startTime || "Anytime"}
                                  {event.endTime ? ` - ${event.endTime}` : ""}
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>

                        {event.locationName ? (
                          <p className="mt-3 flex items-center gap-2 text-sm text-espresso/65">
                            <MapPin className="h-4 w-4 text-terracotta" />
                            {event.locationName}
                          </p>
                        ) : null}
                        {event.notes ? (
                          <p className="mt-3 text-sm leading-7 text-espresso/70">{event.notes}</p>
                        ) : null}

                        <details className="mt-4">
                          <summary className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-burgundy">
                            <Pencil className="h-4 w-4" />
                            Edit event
                          </summary>
                          <div className="mt-4 rounded-lg bg-cream/70 p-4">
                            <EventForm tripId={tripId} dayId={day.id} event={event} />
                          </div>
                        </details>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function EventForm({
  tripId,
  dayId,
  event,
}: {
  tripId: string;
  dayId: string;
  event?: EventItem;
}) {
  return (
    <form action={event ? updateEventAction : createEventAction} className="grid gap-4">
      <input name="tripId" type="hidden" value={tripId} />
      <input name="dayId" type="hidden" value={dayId} />
      {event ? <input name="eventId" type="hidden" value={event.id} /> : null}

      <div className="grid gap-3 sm:grid-cols-[1.3fr_0.8fr]">
        <div className="space-y-2">
          <Label htmlFor={`${event?.id ?? dayId}-title`}>Title</Label>
          <Input
            id={`${event?.id ?? dayId}-title`}
            name="title"
            defaultValue={event?.title}
            placeholder="Dinner at Le Jardin"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${event?.id ?? dayId}-category`}>Category</Label>
          <NativeSelect
            id={`${event?.id ?? dayId}-category`}
            name="category"
            defaultValue={event?.category ?? "ACTIVITY"}
          >
            {categories.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${event?.id ?? dayId}-startTime`}>Start time</Label>
          <Input
            id={`${event?.id ?? dayId}-startTime`}
            name="startTime"
            type="time"
            defaultValue={event?.startTime}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${event?.id ?? dayId}-endTime`}>End time</Label>
          <Input
            id={`${event?.id ?? dayId}-endTime`}
            name="endTime"
            type="time"
            defaultValue={event?.endTime}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${event?.id ?? dayId}-locationName`}>Location</Label>
        <Input
          id={`${event?.id ?? dayId}-locationName`}
          name="locationName"
          defaultValue={event?.locationName}
          placeholder="Riad El Fenn"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${event?.id ?? dayId}-latitude`}>Latitude</Label>
          <Input
            id={`${event?.id ?? dayId}-latitude`}
            name="latitude"
            type="number"
            step="any"
            defaultValue={event?.latitude ?? ""}
            placeholder="31.6258"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${event?.id ?? dayId}-longitude`}>Longitude</Label>
          <Input
            id={`${event?.id ?? dayId}-longitude`}
            name="longitude"
            type="number"
            step="any"
            defaultValue={event?.longitude ?? ""}
            placeholder="-7.9891"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${event?.id ?? dayId}-notes`}>Notes</Label>
        <Textarea
          id={`${event?.id ?? dayId}-notes`}
          name="notes"
          defaultValue={event?.notes}
          placeholder="Reservation notes, confirmation details, or why this stop matters."
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit">{event ? "Save event" : "Add event"}</Button>
        {event ? (
          <Button formAction={deleteEventAction} type="submit" variant="outline">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        ) : null}
      </div>
    </form>
  );
}

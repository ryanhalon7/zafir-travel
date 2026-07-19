"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  CalendarDays,
  Columns3,
  Clock3,
  GripVertical,
  Map,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import {
  createEventAction,
  deleteEventAction,
  reorderEventsAction,
  updateEventAction,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
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
  tripName: string;
  days: DayItem[];
  activeDayId?: string;
  selectedEventId?: string | null;
  onSelectDay: (dayId: string) => void;
  onSelectEvent?: (eventId: string, dayId: string) => void;
  onChangeView: (view: "week" | "month" | "map") => void;
};

const categories = [
  ["FLIGHT", "Flight"],
  ["LODGING", "Hotel"],
  ["ACTIVITY", "Activity"],
  ["FOOD", "Restaurant"],
  ["TRANSPORT", "Transport"],
] as const;

const categoryEmoji: Record<string, string> = {
  FLIGHT: "✈️",
  LODGING: "🏨",
  ACTIVITY: "🎭",
  FOOD: "🍽️",
  TRANSPORT: "🚕",
};

function categoryLabel(category: string) {
  return categories.find(([value]) => value === category)?.[1] ?? category;
}

function moveItem(items: EventItem[], fromId: string, toId: string) {
  const next = [...items];
  const fromIndex = next.findIndex((item) => item.id === fromId);
  const toIndex = next.findIndex((item) => item.id === toId);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return items;
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function shortTime(value: string) {
  if (!value) return "Anytime";
  const [hourValue, minute] = value.split(":").map(Number);
  const suffix = hourValue >= 12 ? "PM" : "AM";
  const hour = hourValue % 12 || 12;
  return `${hour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function eventDuration(start: string, end: string) {
  if (!start || !end) return null;
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  if (minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return [hours ? `${hours}h` : "", remainder ? `${remainder}m` : ""].filter(Boolean).join(" ");
}

function dayParts(day: DayItem) {
  const date = new Date(`${day.date}T00:00:00Z`);
  return {
    weekday: date.toLocaleDateString("en", { weekday: "short", timeZone: "UTC" }).toUpperCase(),
    number: date.getUTCDate(),
    month: date.toLocaleDateString("en", { month: "short", timeZone: "UTC" }),
  };
}

export function ItineraryBoard({
  tripId,
  tripName,
  days,
  activeDayId,
  selectedEventId,
  onSelectDay,
  onSelectEvent,
  onChangeView,
}: ItineraryBoardProps) {
  const [orderedDays, setOrderedDays] = useState(days);
  const [selectedDayId, setSelectedDayId] = useState(days[0]?.id ?? "");
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const addPanelRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setOrderedDays(days);
    setSelectedDayId((current) => {
      if (activeDayId && days.some((day) => day.id === activeDayId)) return activeDayId;
      return days.some((day) => day.id === current) ? current : (days[0]?.id ?? "");
    });
  }, [activeDayId, days]);

  const selectedDay = orderedDays.find((day) => day.id === selectedDayId) ?? orderedDays[0];
  const dateRange = orderedDays.length
    ? `${dayParts(orderedDays[0]).month} ${dayParts(orderedDays[0]).number}–${dayParts(orderedDays[orderedDays.length - 1]).number}`
    : "Dates pending";

  function persistOrder(dayId: string, events: EventItem[]) {
    const formData = new FormData();
    formData.set("tripId", tripId);
    formData.set("dayId", dayId);
    formData.set("eventIds", JSON.stringify(events.map((event) => event.id)));
    startTransition(() => void reorderEventsAction(formData));
  }

  function openAddEvent() {
    setShowAddEvent(true);
    window.setTimeout(() => addPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  }

  return (
    <section className="relative mx-auto max-w-4xl pb-16">
      <header className="flex items-start justify-between gap-4 border-b border-burgundy/10 pb-5">
        <div>
          <h2 className="font-heading text-4xl leading-none text-espresso">Itinerary</h2>
          <p className="mt-2 text-sm text-terracotta/80">
            {tripName} · {orderedDays.length} {orderedDays.length === 1 ? "day" : "days"} · {dateRange}
          </p>
        </div>
        <div className="flex gap-2" aria-label="Itinerary views">
          <ViewIcon label="Week view" onClick={() => onChangeView("week")}><Columns3 className="h-4 w-4" /></ViewIcon>
          <ViewIcon label="Month view" onClick={() => onChangeView("month")}><CalendarDays className="h-4 w-4" /></ViewIcon>
          <ViewIcon label="Map view" onClick={() => onChangeView("map")}><Map className="h-4 w-4" /></ViewIcon>
        </div>
      </header>

      {orderedDays.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-burgundy/10 bg-ivory p-8 text-center shadow-soft">
          <h3 className="font-heading text-2xl text-espresso">Your itinerary needs dates</h3>
          <p className="mt-2 text-sm text-espresso/60">Add the trip dates in Details to create day-by-day plans.</p>
        </div>
      ) : (
        <>
          <div className="hide-scrollbar -mx-4 flex overflow-x-auto border-b border-burgundy/10 px-4 sm:mx-0 sm:px-0">
            {orderedDays.map((day) => {
              const parts = dayParts(day);
              const active = day.id === selectedDay?.id;
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => {
                    setSelectedDayId(day.id);
                    onSelectDay(day.id);
                  }}
                  className={cn(
                    "relative min-w-[4.4rem] px-4 py-4 text-center text-espresso transition hover:bg-terracotta/5",
                    active && "text-terracotta",
                  )}
                  aria-current={active ? "date" : undefined}
                >
                  <span className="block text-[0.65rem] font-bold tracking-wider">{parts.weekday}</span>
                  <span className="mt-1 block text-xl font-bold leading-none">{parts.number}</span>
                  <span className="mt-1 block text-[0.65rem]">{parts.month}</span>
                  <span className={cn("absolute inset-x-0 bottom-0 h-0.5 bg-transparent", active && "bg-terracotta")} />
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <h3 className="font-heading text-xl text-espresso">Day {selectedDay.dayNumber} · {selectedDay.events.length} {selectedDay.events.length === 1 ? "event" : "events"}</h3>
            <button type="button" onClick={() => onChangeView("map")} className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta hover:text-burgundy">
              <Map className="h-3.5 w-3.5" /> View map
            </button>
          </div>

          {selectedDay.events.length === 0 ? (
            <button type="button" onClick={openAddEvent} className="mt-5 w-full rounded-2xl border border-dashed border-terracotta/30 bg-ivory/60 px-6 py-12 text-sm text-espresso/60 transition hover:bg-ivory">
              Nothing scheduled yet. Add the first event.
            </button>
          ) : (
            <div className="mt-4">
              {selectedDay.events.map((event, index) => {
                const duration = eventDuration(event.startTime, event.endTime);
                return (
                  <div key={event.id} className="grid grid-cols-[3.25rem_1.75rem_minmax(0,1fr)] gap-2 sm:grid-cols-[4.5rem_2.25rem_minmax(0,1fr)] sm:gap-3">
                    <p className="pt-1 text-right text-[0.65rem] font-semibold text-terracotta sm:text-xs">{shortTime(event.startTime)}</p>
                    <div className="relative flex justify-center">
                      {index < selectedDay.events.length - 1 ? <span className="absolute bottom-0 top-9 w-px bg-[#dccbb7]" /> : null}
                      <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-burgundy/10 bg-ivory text-sm shadow-soft" title={categoryLabel(event.category)}>{categoryEmoji[event.category] ?? "📌"}</span>
                    </div>
                    <article
                      id={`itinerary-event-${event.id}`}
                      draggable
                      onClick={() => onSelectEvent?.(event.id, selectedDay.id)}
                      onDragStart={() => setDraggedEventId(event.id)}
                      onDragOver={(dragEvent) => dragEvent.preventDefault()}
                      onDrop={() => {
                        if (!draggedEventId) return;
                        const events = moveItem(selectedDay.events, draggedEventId, event.id);
                        setOrderedDays((current) => current.map((day) => day.id === selectedDay.id ? { ...day, events } : day));
                        setDraggedEventId(null);
                        persistOrder(selectedDay.id, events);
                      }}
                      className={cn(
                        "group mb-3 cursor-pointer rounded-2xl border border-burgundy/10 bg-white/75 px-4 py-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-luxe sm:px-5",
                        selectedEventId === event.id && "ring-2 ring-terracotta/50",
                        draggedEventId === event.id && "opacity-50",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-espresso">{event.title}</h4>
                          {event.locationName ? <p className="mt-1 flex items-start gap-1.5 text-xs text-terracotta/75"><MapPin className="mt-0.5 h-3 w-3 shrink-0 fill-current" />{event.locationName}</p> : null}
                          {event.notes ? <p className="mt-2 text-xs leading-5 text-espresso/60">{event.notes}</p> : null}
                          {duration ? <p className="mt-2 flex items-center gap-1 text-[0.65rem] text-espresso/55"><Clock3 className="h-3 w-3" />{duration}</p> : null}
                        </div>
                        <GripVertical className="h-4 w-4 shrink-0 text-espresso/20 opacity-0 transition group-hover:opacity-100" aria-label="Drag to reorder" />
                      </div>
                      <details className="mt-3 border-t border-burgundy/10 pt-3" onClick={(clickEvent) => clickEvent.stopPropagation()}>
                        <summary className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-burgundy"><Pencil className="h-3.5 w-3.5" />Edit event</summary>
                        <div className="mt-4 rounded-xl bg-cream/65 p-4"><EventForm tripId={tripId} dayId={selectedDay.id} event={event} /></div>
                      </details>
                    </article>
                  </div>
                );
              })}
            </div>
          )}

          {showAddEvent ? (
            <div ref={addPanelRef} className="mt-6 rounded-2xl border border-burgundy/10 bg-ivory p-5 shadow-luxe sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div><p className="text-xs font-bold uppercase tracking-wider text-terracotta">Day {selectedDay.dayNumber}</p><h3 className="font-heading text-2xl text-espresso">Add event</h3></div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setShowAddEvent(false)} aria-label="Close add event"><X className="h-4 w-4" /></Button>
              </div>
              <EventForm tripId={tripId} dayId={selectedDay.id} />
            </div>
          ) : null}

          <button type="button" onClick={openAddEvent} aria-label="Add event" className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#cb6d45] text-white shadow-luxe transition hover:scale-105 hover:bg-terracotta md:absolute md:-right-2 md:bottom-0">
            <Plus className="h-5 w-5" strokeWidth={3} />
          </button>
        </>
      )}
    </section>
  );
}

function ViewIcon({ active, label, onClick, children }: { active?: boolean; label: string; onClick?: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} aria-label={label} aria-pressed={active} className={cn("flex h-9 w-9 items-center justify-center rounded-xl border border-burgundy/15 bg-ivory text-burgundy shadow-sm transition hover:border-terracotta/40", active && "bg-terracotta/10 text-terracotta")}>{children}</button>;
}

function EventForm({ tripId, dayId, event }: { tripId: string; dayId: string; event?: EventItem }) {
  function closeFormAfterSubmit(submitEvent: React.FormEvent<HTMLFormElement>) {
    submitEvent.currentTarget.closest("details")?.removeAttribute("open");
  }
  return (
    <form action={event ? updateEventAction : createEventAction} className="grid gap-4" onSubmit={closeFormAfterSubmit}>
      <input name="tripId" type="hidden" value={tripId} />
      <input name="dayId" type="hidden" value={dayId} />
      {event ? <input name="eventId" type="hidden" value={event.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-[1.3fr_0.8fr]">
        <div className="space-y-2"><Label htmlFor={`${event?.id ?? dayId}-title`}>Title</Label><Input id={`${event?.id ?? dayId}-title`} name="title" defaultValue={event?.title} placeholder="Dinner at Le Jardin" required /></div>
        <div className="space-y-2"><Label htmlFor={`${event?.id ?? dayId}-category`}>Category</Label><NativeSelect id={`${event?.id ?? dayId}-category`} name="category" defaultValue={event?.category ?? "ACTIVITY"}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</NativeSelect></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor={`${event?.id ?? dayId}-startTime`}>Start time</Label><Input id={`${event?.id ?? dayId}-startTime`} name="startTime" type="time" defaultValue={event?.startTime} /></div>
        <div className="space-y-2"><Label htmlFor={`${event?.id ?? dayId}-endTime`}>End time</Label><Input id={`${event?.id ?? dayId}-endTime`} name="endTime" type="time" defaultValue={event?.endTime} /></div>
      </div>
      <div className="space-y-2"><Label htmlFor={`${event?.id ?? dayId}-locationName`}>Location</Label><Input id={`${event?.id ?? dayId}-locationName`} name="locationName" defaultValue={event?.locationName} placeholder="Riad El Fenn" /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor={`${event?.id ?? dayId}-latitude`}>Latitude</Label><Input id={`${event?.id ?? dayId}-latitude`} name="latitude" type="number" step="any" defaultValue={event?.latitude ?? ""} /></div>
        <div className="space-y-2"><Label htmlFor={`${event?.id ?? dayId}-longitude`}>Longitude</Label><Input id={`${event?.id ?? dayId}-longitude`} name="longitude" type="number" step="any" defaultValue={event?.longitude ?? ""} /></div>
      </div>
      <div className="space-y-2"><Label htmlFor={`${event?.id ?? dayId}-notes`}>Notes</Label><Textarea id={`${event?.id ?? dayId}-notes`} name="notes" defaultValue={event?.notes} placeholder="Reservation notes or booking details" /></div>
      <div className="flex flex-wrap gap-3"><Button type="submit">{event ? "Save event" : "Add event"}</Button>{event ? <Button formAction={deleteEventAction} type="submit" variant="outline"><Trash2 className="h-4 w-4" />Delete</Button> : null}</div>
    </form>
  );
}

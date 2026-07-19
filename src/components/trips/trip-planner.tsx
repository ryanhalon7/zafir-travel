"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import mapboxgl, { type Map as MapboxMap, type Marker } from "mapbox-gl";
import { CalendarDays, ChevronLeft, ChevronRight, List, MapPinned } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ItineraryBoard, type DayItem, type EventItem } from "@/components/trips/itinerary-board";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

type PlannerView = "list" | "week" | "month" | "map";
type CalendarMode = "month" | "week";

export function TripPlanner({ tripId, tripName, days }: { tripId: string; tripName: string; days: DayItem[] }) {
  const [view, setView] = useState<PlannerView>("list");
  const [selectedDayId, setSelectedDayId] = useState(days[0]?.id ?? "");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    if (!days.some((day) => day.id === selectedDayId)) {
      setSelectedDayId(days[0]?.id ?? "");
    }

    if (
      selectedEventId &&
      !days.some((day) => day.events.some((event) => event.id === selectedEventId))
    ) {
      setSelectedEventId(null);
    }
  }, [days, selectedDayId, selectedEventId]);

  function selectEvent(eventId: string, dayId: string) {
    setSelectedDayId(dayId);
    setSelectedEventId(eventId);
  }

  function showInItinerary(eventId: string, dayId: string) {
    selectEvent(eventId, dayId);
    setView("list");
    window.setTimeout(() => {
      document.getElementById(`itinerary-event-${eventId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  return (
    <div className="space-y-5">
      {view === "map" ? <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-sand/70 p-1">
          <ViewButton active={false} onClick={() => setView("list")} icon={List}>Itinerary</ViewButton>
          <ViewButton active={false} onClick={() => setView("month")} icon={CalendarDays}>Calendar</ViewButton>
          <ViewButton active={view === "map"} onClick={() => setView("map")} icon={MapPinned}>Map</ViewButton>
        </div>
      </div> : null}

      {view === "list" ? (
        <ItineraryBoard
          days={days}
          activeDayId={selectedDayId}
          tripId={tripId}
          tripName={tripName}
          selectedEventId={selectedEventId}
          onSelectDay={setSelectedDayId}
          onSelectEvent={selectEvent}
          onChangeView={setView}
        />
      ) : null}
      {view === "week" ? (
        <TripWeek days={days} onBack={() => setView("list")} onSelectEvent={showInItinerary} />
      ) : null}
      {view === "month" ? (
        <TripMonth days={days} tripName={tripName} onBack={() => setView("list")} onSelectEvent={showInItinerary} />
      ) : null}
      {view === "map" ? (
        <TripMap
          days={days}
          selectedDayId={selectedDayId}
          selectedEventId={selectedEventId}
          onSelectDay={setSelectedDayId}
          onSelectEvent={selectEvent}
          onShowInItinerary={showInItinerary}
        />
      ) : null}
    </div>
  );
}

function ViewButton({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: typeof List; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition", active && "bg-ivory text-burgundy shadow-soft")}>
      <Icon className="h-4 w-4" />{children}
    </button>
  );
}

const WEEK_START_HOUR = 8;
const WEEK_END_HOUR = 21;
const WEEK_HOUR_HEIGHT = 48;

function TripWeek({
  days,
  onBack,
  onSelectEvent,
}: {
  days: DayItem[];
  onBack: () => void;
  onSelectEvent: (eventId: string, dayId: string) => void;
}) {
  const firstTripDate = days[0]?.date;
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = useMemo(() => {
    const date = firstTripDate ? new Date(`${firstTripDate}T00:00:00Z`) : new Date();
    date.setUTCDate(date.getUTCDate() + weekOffset * 7);
    return date;
  }, [firstTripDate, weekOffset]);
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addUtcDays(weekStart, index)),
    [weekStart],
  );
  const daysByDate = useMemo(() => new Map(days.map((day) => [day.date, day])), [days]);
  const weekEnd = weekDates[6];
  const title = `Week of ${weekStart.toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" })}–${weekEnd.toLocaleDateString("en", {
    month: weekStart.getUTCMonth() === weekEnd.getUTCMonth() ? undefined : "short",
    day: "numeric",
    timeZone: "UTC",
  })}`;
  const hours = Array.from({ length: WEEK_END_HOUR - WEEK_START_HOUR + 1 }, (_, index) => WEEK_START_HOUR + index);
  const timelineHeight = (WEEK_END_HOUR - WEEK_START_HOUR) * WEEK_HOUR_HEIGHT;

  return (
    <section className="mx-auto max-w-6xl overflow-hidden bg-[#fbf8f2]">
      <header className="flex min-h-12 items-center justify-between gap-3 border-b border-burgundy/10 px-1 pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={onBack} className="inline-flex shrink-0 items-center gap-0.5 text-sm text-burgundy hover:text-terracotta">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <h2 className="truncate font-heading text-2xl text-espresso">{title}</h2>
        </div>
        <div className="hidden gap-1 sm:flex">
          <Button type="button" variant="ghost" size="icon" onClick={() => setWeekOffset((value) => value - 1)} aria-label="Previous week"><ChevronLeft className="h-4 w-4" /></Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => setWeekOffset((value) => value + 1)} aria-label="Next week"><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </header>

      <div className="hide-scrollbar -mx-4 overflow-x-auto sm:mx-0">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-[3.5rem_repeat(7,minmax(4.85rem,1fr))] border-b border-burgundy/10">
            <div className="sticky left-0 z-20 border-r border-burgundy/10 bg-[#fbf8f2]" />
            {weekDates.map((date) => {
              const itineraryDay = daysByDate.get(isoDate(date));
              const hasEvents = Boolean(itineraryDay?.events.length);
              return (
                <div key={isoDate(date)} className="border-r border-burgundy/10 px-2 py-3 text-center last:border-r-0">
                  <span className="block text-[0.6rem] font-bold text-espresso/70">{date.toLocaleDateString("en", { weekday: "short", timeZone: "UTC" })}</span>
                  <span className={cn("mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold", hasEvents && "bg-terracotta text-white")}>{date.getUTCDate()}</span>
                </div>
              );
            })}
          </div>

          <div className="relative grid grid-cols-[3.5rem_repeat(7,minmax(4.85rem,1fr))]" style={{ height: timelineHeight }}>
            <div className="sticky left-0 z-20 border-r border-burgundy/10 bg-[#fbf8f2]">
              {hours.slice(0, -1).map((hour, index) => <span key={hour} className="absolute right-2 -translate-y-1/2 text-[0.6rem] text-espresso/60" style={{ top: index * WEEK_HOUR_HEIGHT }}>{formatHour(hour)}</span>)}
            </div>
            {weekDates.map((date) => {
              const day = daysByDate.get(isoDate(date));
              return (
                <div key={isoDate(date)} className="relative border-r border-burgundy/10 last:border-r-0">
                  {hours.slice(0, -1).map((hour, index) => <span key={hour} className="absolute inset-x-0 border-t border-burgundy/[0.08]" style={{ top: index * WEEK_HOUR_HEIGHT }} />)}
                  {day?.events.map((event, eventIndex) => {
                    const position = weekEventPosition(event, eventIndex);
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => onSelectEvent(event.id, day.id)}
                        title={`${event.title}${event.locationName ? ` · ${event.locationName}` : ""}`}
                        className="absolute inset-x-1 z-10 overflow-hidden rounded bg-[#ead9d1] px-1.5 py-1 text-left text-[0.58rem] font-semibold leading-tight text-[#9c4d32] shadow-sm transition hover:z-20 hover:bg-[#dfc5ba] focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
                        style={{ top: position.top, minHeight: position.height }}
                      >
                        <span className="line-clamp-2 border-l-2 border-terracotta pl-1">{event.title}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between sm:hidden">
        <Button type="button" variant="ghost" size="sm" onClick={() => setWeekOffset((value) => value - 1)}><ChevronLeft className="h-4 w-4" /> Previous</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setWeekOffset((value) => value + 1)}>Next <ChevronRight className="h-4 w-4" /></Button>
      </div>
    </section>
  );
}

function weekEventPosition(event: EventItem, fallbackIndex: number) {
  const [startHour, startMinute] = event.startTime
    ? event.startTime.split(":").map(Number)
    : [WEEK_START_HOUR + fallbackIndex, 0];
  const [endHour, endMinute] = event.endTime
    ? event.endTime.split(":").map(Number)
    : [startHour, startMinute + 45];
  const start = Math.max(WEEK_START_HOUR * 60, Math.min(WEEK_END_HOUR * 60 - 20, startHour * 60 + startMinute));
  const end = Math.max(start + 20, Math.min(WEEK_END_HOUR * 60, endHour * 60 + endMinute));
  return {
    top: ((start - WEEK_START_HOUR * 60) / 60) * WEEK_HOUR_HEIGHT + 2,
    height: Math.max(24, ((end - start) / 60) * WEEK_HOUR_HEIGHT - 4),
  };
}

function formatHour(hour: number) {
  if (hour === 12) return "12 PM";
  return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
}

function addUtcDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

function TripMonth({ days, tripName, onBack, onSelectEvent }: { days: DayItem[]; tripName: string; onBack: () => void; onSelectEvent: (eventId: string, dayId: string) => void }) {
  const firstDate = days[0]?.date;
  const [cursor, setCursor] = useState(() => firstDate ? new Date(`${firstDate}T00:00:00Z`) : new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const daysByDate = useMemo(() => new Map(days.map((day) => [day.date, day])), [days]);
  const cells = useMemo(() => monthCells(cursor), [cursor]);
  const monthEvents = useMemo(() => days
    .filter((day) => {
      const date = new Date(`${day.date}T00:00:00Z`);
      return date.getUTCFullYear() === cursor.getUTCFullYear()
        && date.getUTCMonth() === cursor.getUTCMonth()
        && (!selectedDate || day.date === selectedDate);
    })
    .flatMap((day) => day.events.map((event) => ({ event, day }))), [cursor, days, selectedDate]);
  const firstDay = days[0];
  const lastDay = days[days.length - 1];

  function moveMonth(amount: number) {
    setCursor((current) => new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + amount, 1)));
    setSelectedDate(null);
  }

  return (
    <section className="mx-auto max-w-3xl">
      <header className="flex min-h-12 items-center justify-between gap-3 border-b border-burgundy/10 pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={onBack} className="inline-flex shrink-0 items-center gap-0.5 text-sm text-burgundy hover:text-terracotta"><ChevronLeft className="h-4 w-4" /> Back</button>
          <h2 className="font-heading text-2xl text-espresso">{cursor.toLocaleDateString("en", { month: "long", year: "numeric", timeZone: "UTC" })}</h2>
        </div>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="icon" onClick={() => moveMonth(-1)} aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => moveMonth(1)} aria-label="Next month"><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </header>

      <div className="mt-4">
        <div className="grid grid-cols-7 py-2">
          {(["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const).map((label) => <div key={label} className="text-center text-[0.65rem] font-bold text-espresso">{label}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((date) => {
            const iso = isoDate(date);
            const itineraryDay = daysByDate.get(iso);
            const outside = date.getUTCMonth() !== cursor.getUTCMonth();
            const selected = selectedDate === iso;
            return (
              <button
                key={iso}
                type="button"
                disabled={outside}
                onClick={() => setSelectedDate((current) => current === iso ? null : iso)}
                className={cn(
                  "mx-0.5 flex h-12 flex-col items-center justify-center rounded-xl text-sm text-espresso/75 transition sm:h-14",
                  outside && "invisible",
                  itineraryDay && "bg-[#ead9d1] text-terracotta hover:bg-[#dfc5ba]",
                  selected && "bg-terracotta font-bold text-white hover:bg-terracotta",
                )}
                aria-pressed={selected}
              >
                <span>{date.getUTCDate()}</span>
                {itineraryDay?.events.length ? <span className="mt-1 flex gap-0.5" aria-label={`${itineraryDay.events.length} events`}>{Array.from({ length: Math.min(3, itineraryDay.events.length) }, (_, index) => <span key={index} className="h-1 w-1 rounded-full bg-current" />)}</span> : null}
              </button>
            );
          })}
        </div>
      </div>

      {firstDay && lastDay ? <div className="mt-5 flex items-center justify-between rounded-xl bg-[#ead9d1] px-4 py-3 text-xs text-terracotta">
        <span className="flex min-w-0 items-center gap-2 font-semibold"><span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-terracotta" /><span className="truncate">{tripName}</span></span>
        <span className="ml-3 shrink-0 text-espresso/55">{formatDateRange(firstDay.date, lastDay.date)}</span>
      </div> : null}

      <div className="mt-6">
        <h3 className="font-heading text-2xl text-espresso">{selectedDate ? `Events on ${formatMonthDay(selectedDate)}` : `Events in ${cursor.toLocaleDateString("en", { month: "long", timeZone: "UTC" })}`}</h3>
        <div className="mt-3 space-y-2">
          {monthEvents.length ? monthEvents.map(({ event, day }) => <button key={event.id} type="button" onClick={() => onSelectEvent(event.id, day.id)} className="flex w-full items-center gap-3 rounded-2xl border border-burgundy/10 bg-white/75 p-3 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-luxe">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cream text-base">{eventEmoji(event.category)}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-espresso">{event.title}</span><span className="mt-0.5 block text-[0.65rem] text-terracotta/75">{formatMonthDay(day.date)} · {formatEventTime(event.startTime)}</span></span>
          </button>) : <div className="rounded-2xl border border-dashed border-burgundy/15 px-5 py-8 text-center text-sm text-espresso/55">No events for this selection.</div>}
        </div>
      </div>
    </section>
  );
}

function monthCells(cursor: Date) {
  const start = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1));
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  return Array.from({ length: 42 }, (_, index) => addUtcDays(start, index));
}

function formatMonthDay(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" });
}

function formatDateRange(start: string, end: string) {
  return `${formatMonthDay(start)}–${new Date(`${end}T00:00:00Z`).getUTCDate()}`;
}

function formatEventTime(value: string) {
  if (!value) return "Anytime";
  const [hourValue, minute] = value.split(":").map(Number);
  return `${hourValue % 12 || 12}:${String(minute).padStart(2, "0")} ${hourValue >= 12 ? "PM" : "AM"}`;
}

function eventEmoji(category: string) {
  return ({ FLIGHT: "✈️", LODGING: "🏨", ACTIVITY: "🎭", FOOD: "🍽️", TRANSPORT: "🚕" } as Record<string, string>)[category] ?? "📌";
}

export function TripCalendar({ days, selectedEventId, onSelectEvent }: { days: DayItem[]; selectedEventId: string | null; onSelectEvent: (eventId: string, dayId: string) => void }) {
  const firstDate = days[0]?.date ? new Date(`${days[0].date}T00:00:00Z`) : new Date();
  const [mode, setMode] = useState<CalendarMode>("month");
  const [cursor, setCursor] = useState(firstDate);
  const eventsByDate = useMemo(() => new Map(days.map((day) => [day.date, day])), [days]);
  const cells = useMemo(() => calendarCells(cursor, mode), [cursor, mode]);
  const title = mode === "month"
    ? cursor.toLocaleDateString("en", { month: "long", year: "numeric", timeZone: "UTC" })
    : `${formatShort(cells[0])} – ${formatShort(cells[cells.length - 1])}`;

  function move(amount: number) {
    const next = new Date(cursor);
    if (mode === "month") next.setUTCMonth(next.getUTCMonth() + amount);
    else next.setUTCDate(next.getUTCDate() + amount * 7);
    setCursor(next);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><CardTitle>Trip calendar</CardTitle><CardDescription>Every scheduled itinerary event in one place.</CardDescription></div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => move(-1)} aria-label="Previous"><ChevronLeft className="h-4 w-4" /></Button>
            <NativeSelect className="w-28" value={mode} onChange={(event) => setMode(event.target.value as CalendarMode)}><option value="month">Month</option><option value="week">Week</option></NativeSelect>
            <Button variant="outline" size="icon" onClick={() => move(1)} aria-label="Next"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
        <h3 className="pt-3 font-heading text-2xl text-burgundy">{title}</h3>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 border-l border-t border-burgundy/10">
          {(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const).map((day) => <div key={day} className="border-b border-r border-burgundy/10 bg-sand/50 p-2 text-center text-xs font-bold uppercase text-espresso/55">{day}</div>)}
          {cells.map((date) => {
            const iso = isoDate(date); const day = eventsByDate.get(iso); const outside = mode === "month" && date.getUTCMonth() !== cursor.getUTCMonth();
            return <div key={iso} className={cn("min-h-32 border-b border-r border-burgundy/10 p-2", outside && "bg-cream/45 text-espresso/35")}>
              <span className="text-xs font-bold">{date.getUTCDate()}</span>
              <div className="mt-2 space-y-1">{day?.events.map((event) => <button key={event.id} type="button" onClick={() => onSelectEvent(event.id, day.id)} className={cn("block w-full rounded-md bg-burgundy/10 px-2 py-1.5 text-left text-xs font-semibold text-burgundy hover:bg-muted-gold/25", selectedEventId === event.id && "bg-muted-gold/35 ring-1 ring-muted-gold")}><span className="block truncate">{event.startTime && `${event.startTime} `}{event.title}</span></button>)}</div>
            </div>;
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function TripMap({ days, selectedDayId, selectedEventId, onSelectDay, onSelectEvent, onShowInItinerary }: { days: DayItem[]; selectedDayId: string; selectedEventId: string | null; onSelectDay: (id: string) => void; onSelectEvent: (eventId: string, dayId: string) => void; onShowInItinerary: (eventId: string, dayId: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const selectedDay = days.find((day) => day.id === selectedDayId) ?? days[0];
  const mappedEvents = useMemo(
    () => selectedDay?.events.filter(hasCoordinates) ?? [],
    [selectedDay],
  );
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  useEffect(() => {
    if (!containerRef.current || !token || mapRef.current) return;
    mapboxgl.accessToken = token;
    mapRef.current = new mapboxgl.Map({ container: containerRef.current, style: "mapbox://styles/mapbox/streets-v12", center: [0, 20], zoom: 1.5 });
    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedDay) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = mappedEvents.map((event) => {
      const element = document.createElement("button");
      element.className = cn("h-7 w-7 rounded-full border-2 border-ivory bg-burgundy shadow-luxe transition", selectedEventId === event.id && "scale-125 bg-muted-gold");
      element.type = "button"; element.title = event.title;
      element.addEventListener("click", () => onSelectEvent(event.id, selectedDay.id));
      return new mapboxgl.Marker({ element }).setLngLat([event.longitude, event.latitude]).addTo(map);
    });
    if (mappedEvents.length) {
      const bounds = new mapboxgl.LngLatBounds();
      mappedEvents.forEach((event) => bounds.extend([event.longitude, event.latitude]));
      map.fitBounds(bounds, { padding: 70, maxZoom: 13, duration: 600 });
    }
  }, [mappedEvents, onSelectEvent, selectedDay, selectedEventId]);

  if (!days.length) return <Card><CardHeader><CardTitle>Dates needed</CardTitle><CardDescription>Add trip dates before using the map.</CardDescription></CardHeader></Card>;

  return <div className="grid gap-5 lg:grid-cols-[330px_1fr]">
    <Card><CardHeader><CardTitle>Day map</CardTitle><CardDescription>Choose a day, then select an event or its pin.</CardDescription></CardHeader><CardContent className="space-y-4">
      <NativeSelect value={selectedDay?.id} onChange={(event) => { onSelectDay(event.target.value); }}>
        {days.map((day) => <option key={day.id} value={day.id}>Day {day.dayNumber} · {day.dateLabel}</option>)}
      </NativeSelect>
      <div className="space-y-2">{selectedDay?.events.map((event) => <button key={event.id} type="button" onClick={() => onSelectEvent(event.id, selectedDay.id)} onDoubleClick={() => onShowInItinerary(event.id, selectedDay.id)} className={cn("w-full rounded-lg bg-cream/75 p-3 text-left transition hover:bg-sand", selectedEventId === event.id && "bg-sand ring-2 ring-muted-gold")}><div className="flex items-start justify-between gap-2"><span className="font-semibold text-burgundy">{event.title}</span>{hasCoordinates(event) ? <MapPinned className="h-4 w-4 shrink-0 text-terracotta" /> : null}</div><p className="mt-1 text-xs text-espresso/60">{event.locationName || "No location"}</p></button>)}</div>
      {selectedEventId ? <Button className="w-full" variant="outline" onClick={() => onShowInItinerary(selectedEventId, selectedDay!.id)}>Show in itinerary</Button> : null}
    </CardContent></Card>
    <Card className="relative overflow-hidden"><div ref={containerRef} className="h-[620px] w-full bg-sand/60">{!token ? <div className="flex h-full items-center justify-center p-8 text-center text-sm text-espresso/65">Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to enable the interactive map.</div> : null}</div>{token && mappedEvents.length === 0 ? <div className="absolute inset-x-0 bottom-4 mx-auto w-fit rounded-full bg-ivory px-4 py-2 text-sm shadow-luxe">No coordinates for this day.</div> : null}</Card>
  </div>;
}

function hasCoordinates(event: EventItem): event is EventItem & { latitude: number; longitude: number } { return event.latitude !== null && event.longitude !== null; }
function isoDate(date: Date) { return date.toISOString().slice(0, 10); }
function formatShort(date: Date) { return date.toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" }); }
function calendarCells(cursor: Date, mode: CalendarMode) {
  const start = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), mode === "month" ? 1 : cursor.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  const count = mode === "month" ? 42 : 7;
  return Array.from({ length: count }, (_, index) => { const date = new Date(start); date.setUTCDate(start.getUTCDate() + index); return date; });
}

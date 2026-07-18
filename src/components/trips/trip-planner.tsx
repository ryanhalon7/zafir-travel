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

type PlannerView = "list" | "calendar" | "map";
type CalendarMode = "month" | "week";

export function TripPlanner({ tripId, days }: { tripId: string; days: DayItem[] }) {
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-sand/70 p-1">
          <ViewButton active={view === "list"} onClick={() => setView("list")} icon={List}>Itinerary</ViewButton>
          <ViewButton active={view === "calendar"} onClick={() => setView("calendar")} icon={CalendarDays}>Calendar</ViewButton>
          <ViewButton active={view === "map"} onClick={() => setView("map")} icon={MapPinned}>Map</ViewButton>
        </div>
      </div>

      {view === "list" ? (
        <ItineraryBoard
          days={days}
          tripId={tripId}
          selectedEventId={selectedEventId}
          onSelectEvent={selectEvent}
        />
      ) : null}
      {view === "calendar" ? (
        <TripCalendar days={days} selectedEventId={selectedEventId} onSelectEvent={showInItinerary} />
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

function TripCalendar({ days, selectedEventId, onSelectEvent }: { days: DayItem[]; selectedEventId: string | null; onSelectEvent: (eventId: string, dayId: string) => void }) {
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

"use client";

import Image from "next/image";
import Link from "next/link";
import { Camera, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type Photo = {
  id: string;
  url: string;
  fileName: string;
  caption: string;
  uploaderId: string;
  uploaderName: string;
  createdAt: string;
};

type PhotoDay = {
  key: string;
  date: Date;
  photos: Photo[];
};

const signedImageLoader = ({ src }: { src: string }) => src;

export function PhotoGallery({
  tripId,
  photos,
  tripName,
  currentUserId,
}: {
  tripId: string;
  photos: Photo[];
  tripName: string;
  currentUserId: string;
}) {
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null);
  const days = useMemo(() => groupPhotosByDay(photos), [photos]);
  const mine = photos.filter((photo) => photo.uploaderId === currentUserId).length;
  const collaboratorCount = photos.length - mine;
  const collaboratorName = photos.find((photo) => photo.uploaderId !== currentUserId)?.uploaderName;

  return (
    <div className="mx-auto -mt-4 max-w-6xl pb-8 md:mt-0 md:pb-0">
      <header className="border-b border-burgundy/10 pb-6 md:flex md:items-start md:justify-between">
        <div>
          <h1 className="font-heading text-[2.15rem] leading-none text-espresso md:text-5xl">Photos</h1>
          <p className="mt-2 text-sm text-espresso/55">{photos.length} {photos.length === 1 ? "memory" : "memories"} · {tripName}</p>
        </div>
        <Link href={`/trips/${tripId}/photos/add`} className="absolute right-4 top-6 inline-flex items-center gap-1 rounded-xl bg-terracotta px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-terracotta/90 md:static" aria-label="Add photos">
          <Plus className="h-4 w-4" strokeWidth={3} /> Upload
        </Link>
        <div className="mt-6 grid max-w-md grid-cols-4 gap-7 md:absolute md:mt-20">
          <Metric value={photos.length} label="Total" />
          <Metric value={mine} label="By me" />
          <Metric value={collaboratorCount} label={collaboratorName ? `By ${firstName(collaboratorName)}` : "By partner"} />
          <Metric value={days.length} label={days.length === 1 ? "Day" : "Days"} />
        </div>
        <div className="h-0 md:h-12" />
      </header>

      {photos.length === 0 ? (
        <div className="flex min-h-[52vh] flex-col items-center justify-center text-center">
          <span className="rounded-full bg-terracotta/10 p-4 text-terracotta"><Camera className="h-7 w-7" /></span>
          <h2 className="mt-4 font-heading text-3xl text-espresso">No memories yet</h2>
          <p className="mt-2 max-w-sm text-sm text-espresso/55">Your favorite moments from {tripName} will appear here.</p>
        </div>
      ) : (
        <div className="space-y-10 pt-7 md:space-y-14 md:pt-10">
          {days.map((day, index) => (
            <section key={day.key} aria-labelledby={`photo-day-${day.key}`}>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-terracotta px-2 text-sm font-bold text-white shadow-soft">{index + 1}</span>
                  <div>
                    <h2 id={`photo-day-${day.key}`} className="font-heading text-lg leading-5 text-espresso md:text-2xl">Day {index + 1}</h2>
                    <p className="mt-1 text-xs text-espresso/50 md:text-sm">{formatPhotoDate(day.date)}</p>
                  </div>
                </div>
                <p className="pt-1 text-xs text-espresso/65 md:text-sm">{day.photos.length} {day.photos.length === 1 ? "photo" : "photos"}</p>
              </div>

              <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:gap-2 lg:grid-cols-4">
                {day.photos.map((photo, photoIndex) => (
                  <button key={photo.id} type="button" onClick={() => setActivePhoto(photo)} className={cn("group relative aspect-square overflow-hidden bg-sand text-left", photoIndex === 0 && "rounded-l-2xl", photoIndex === day.photos.length - 1 && "rounded-r-2xl")}>
                    <Image loader={signedImageLoader} unoptimized src={photo.url} alt={photo.caption || photo.fileName} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" />
                    <span className="absolute inset-0 bg-gradient-to-t from-espresso/30 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/80 bg-burgundy text-[10px] font-bold uppercase text-white shadow-md">{initials(photo.uploaderName)}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Link href={`/trips/${tripId}/photos/add`} aria-label="Add photos" className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom)+1rem)] right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-terracotta text-white shadow-luxe md:hidden"><Plus className="h-5 w-5" strokeWidth={3} /></Link>

      {activePhoto ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-espresso/95 p-4" role="dialog" aria-modal="true" aria-label={activePhoto.caption || activePhoto.fileName} onClick={() => setActivePhoto(null)}>
          <button type="button" onClick={() => setActivePhoto(null)} className="absolute right-5 top-5 rounded-full bg-white/10 p-3 text-white" aria-label="Close photo"><X className="h-5 w-5" /></button>
          <div className="max-h-[90vh] max-w-6xl" onClick={(event) => event.stopPropagation()}>
            <Image loader={signedImageLoader} unoptimized src={activePhoto.url} alt={activePhoto.caption || activePhoto.fileName} width={1600} height={1200} className="max-h-[82vh] w-auto rounded-xl object-contain shadow-luxe" />
            <p className="mt-3 text-center text-sm text-white/80">{activePhoto.caption || `Added by ${activePhoto.uploaderName}`}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return <div><p className="font-heading text-xl font-bold leading-none text-espresso md:text-2xl">{value}</p><p className="mt-2 whitespace-nowrap text-[0.65rem] text-terracotta/80 md:text-xs">{label}</p></div>;
}

function groupPhotosByDay(photos: Photo[]) {
  const groups = new Map<string, PhotoDay>();
  photos.forEach((photo) => {
    const date = new Date(photo.createdAt);
    const key = Number.isNaN(date.getTime()) ? "unknown" : date.toISOString().slice(0, 10);
    const group = groups.get(key) ?? { key, date, photos: [] };
    group.photos.push(photo);
    groups.set(key, group);
  });
  return Array.from(groups.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

function formatPhotoDate(date: Date) {
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(date);
}

function firstName(name: string) { return name.includes("@") ? "partner" : name.trim().split(/\s+/)[0]; }
function initials(name: string) { const source = name.includes("@") ? name.split("@")[0] : name; return source.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("") || "?"; }

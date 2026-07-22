"use client";

import Image from "next/image";
import { Camera, X } from "lucide-react";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";

import { uploadTripPhotosAction } from "@/app/actions";

type TripDayOption = {
  id: string;
  dayNumber: number;
  dateLabel: string;
};

export function PhotoUploadForm({ tripId, days }: { tripId: string; days: TripDayOption[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const next = files.map((file) => URL.createObjectURL(file));
    setPreviews(next);
    return () => next.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  function updateFiles(next: File[]) {
    const limited = next.slice(0, 12);
    setFiles(limited);
    if (inputRef.current && typeof DataTransfer !== "undefined") {
      const transfer = new DataTransfer();
      limited.forEach((file) => transfer.items.add(file));
      inputRef.current.files = transfer.files;
    }
  }

  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    updateFiles(Array.from(event.target.files ?? []));
  }

  function dropFiles(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    updateFiles(Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith("image/")));
  }

  return (
    <form action={uploadTripPhotosAction} className="space-y-7">
      <input type="hidden" name="tripId" value={tripId} />
      <label
        htmlFor="photos"
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={dropFiles}
        className={`flex min-h-[17rem] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition md:min-h-[22rem] ${dragging ? "border-terracotta bg-terracotta/5" : "border-sand bg-ivory/35 hover:border-terracotta/60"}`}
      >
        <input ref={inputRef} id="photos" name="photos" type="file" accept="image/jpeg,image/png,image/heic,image/heif" multiple required onChange={selectFiles} className="sr-only" />
        <Camera className="h-11 w-11 text-espresso/55" strokeWidth={1.5} />
        <span className="mt-5 font-heading text-2xl text-espresso">Drop photos here</span>
        <span className="mt-2 text-sm text-terracotta/70">or tap to browse your camera roll</span>
        <span className="mt-4 rounded-xl bg-terracotta px-6 py-3 text-sm font-bold text-white shadow-soft">Browse Photos</span>
        <span className="mt-3 text-[0.7rem] font-semibold text-espresso/55">JPG, PNG, HEIC up to 50MB</span>
      </label>

      {files.length > 0 ? (
        <section>
          <h2 className="font-heading text-xl text-espresso">Selected photos</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div key={`${file.name}-${file.lastModified}`} className="relative h-[4.6rem] w-[4.6rem] overflow-hidden rounded-xl bg-sand">
                {previews[index] ? <Image src={previews[index]} alt={file.name} fill unoptimized className="object-cover" /> : null}
                <button type="button" onClick={() => updateFiles(files.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-espresso/70 text-white" aria-label={`Remove ${file.name}`}><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="dayId" className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-espresso/75">Add to day</label>
        <select id="dayId" name="dayId" defaultValue={days[0]?.id} required className="h-12 w-full rounded-xl border border-sand bg-ivory px-4 text-sm text-espresso outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/15">
          {days.map((day) => <option key={day.id} value={day.id}>Day {day.dayNumber} — {day.dateLabel}</option>)}
        </select>
      </div>

      <button type="submit" disabled={files.length === 0 || days.length === 0} className="h-12 w-full rounded-xl bg-terracotta text-sm font-bold text-white shadow-soft transition hover:bg-terracotta/90 disabled:cursor-not-allowed disabled:opacity-45">
        Upload {files.length || ""} {files.length === 1 ? "Photo" : "Photos"}
      </button>
    </form>
  );
}

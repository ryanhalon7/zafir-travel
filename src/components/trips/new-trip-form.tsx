"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ImageIcon,
  MapPin,
  PencilLine,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type NewTripFormProps = {
  message?: string;
  createTripAction: (formData: FormData) => void | Promise<void>;
};

type FormValues = {
  name: string;
  destinations: string;
  startDate: string;
  endDate: string;
};

const steps = [
  { number: 1, label: "Details" },
  { number: 2, label: "Dates" },
  { number: 3, label: "Cover" },
  { number: 4, label: "Review" },
] as const;

const initialValues: FormValues = {
  name: "",
  destinations: "",
  startDate: "",
  endDate: "",
};

export function NewTripForm({ message, createTripAction }: NewTripFormProps) {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState(initialValues);
  const [coverName, setCoverName] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [error, setError] = useState(message ?? "");

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  const dateSummary = useMemo(
    () => formatDateSummary(values.startDate, values.endDate),
    [values.endDate, values.startDate],
  );

  function updateValue(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (error) setError("");
  }

  function validateCurrentStep() {
    if (step === 1) {
      if (values.name.trim().length < 2) {
        setError("Give your trip a name with at least two characters.");
        return false;
      }
      if (!values.destinations.trim()) {
        setError("Add at least one destination.");
        return false;
      }
    }

    if (step === 2) {
      if (!values.startDate || !values.endDate) {
        setError("Choose both a start date and an end date.");
        return false;
      }
      if (values.endDate < values.startDate) {
        setError("The end date must be on or after the start date.");
        return false;
      }
    }

    setError("");
    return true;
  }

  function goNext() {
    if (!validateCurrentStep()) return;
    setStep((current) => Math.min(4, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setError("");
    setStep((current) => Math.max(1, current - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCoverChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setCoverName("");
      setCoverPreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      event.target.value = "";
      setError("Choose an image file for the trip cover.");
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      event.target.value = "";
      setError("Choose a cover image smaller than 12 MB.");
      return;
    }

    setError("");
    setCoverName(file.name);
    setCoverPreview(URL.createObjectURL(file));
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="flex items-center gap-3 border-b border-burgundy/10 pb-5">
        {step === 1 ? (
          <Button asChild variant="ghost" size="sm" className="-ml-3">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </Link>
          </Button>
        ) : (
          <Button type="button" variant="ghost" size="sm" className="-ml-3" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Button>
        )}
        <h1 className="font-heading text-2xl text-burgundy sm:text-3xl">New Trip</h1>
      </header>

      <ol className="hide-scrollbar -mx-4 flex overflow-x-auto border-b border-burgundy/10 px-4 py-5 sm:mx-0 sm:px-0" aria-label="Trip creation progress">
        {steps.map((item, index) => {
          const active = step === item.number;
          const complete = step > item.number;
          return (
            <li key={item.number} className="flex min-w-0 flex-1 items-center">
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
                    active && "bg-terracotta text-ivory",
                    complete && "bg-burgundy text-ivory",
                    !active && !complete && "bg-sand/70 text-espresso/55",
                  )}
                >
                  {complete ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : item.number}
                </span>
                <span
                  className={cn(
                    "whitespace-nowrap text-xs font-semibold",
                    active ? "text-burgundy" : "text-espresso/50",
                  )}
                >
                  {item.label}
                </span>
              </div>
              {index < steps.length - 1 ? (
                <span className="mx-3 h-px min-w-5 flex-1 bg-burgundy/15" aria-hidden="true" />
              ) : null}
            </li>
          );
        })}
      </ol>

      {error ? (
        <div role="alert" className="mt-6 rounded-2xl border border-terracotta/25 bg-terracotta/10 px-4 py-3 text-sm font-semibold text-burgundy">
          {error}
        </div>
      ) : null}

      <form action={createTripAction} className="pb-28" encType="multipart/form-data">
        <input type="hidden" name="status" value="PLANNING" />

        <section className={cn("pt-8", step !== 1 && "hidden")} aria-hidden={step !== 1}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-terracotta">Step one</p>
          <h2 className="mt-3 font-heading text-3xl text-burgundy sm:text-4xl">
            Where are you going?
          </h2>
          <p className="mt-2 text-sm leading-6 text-espresso/60">
            Give your trip a name and tell us the destination.
          </p>

          <div className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs uppercase tracking-[0.12em]">Trip name</Label>
              <Input
                id="name"
                name="name"
                value={values.name}
                onChange={(event) => updateValue("name", event.target.value)}
                placeholder="e.g. Paris in the Spring"
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destinations" className="text-xs uppercase tracking-[0.12em]">Destination</Label>
              <Input
                id="destinations"
                name="destinations"
                value={values.destinations}
                onChange={(event) => updateValue("destinations", event.target.value)}
                placeholder="e.g. Paris, France"
                autoComplete="off"
                required
              />
              <p className="text-xs text-espresso/45">Separate multiple destinations with commas.</p>
            </div>
          </div>
        </section>

        <section className={cn("pt-8", step !== 2 && "hidden")} aria-hidden={step !== 2}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-terracotta">Step two</p>
          <h2 className="mt-3 font-heading text-3xl text-burgundy sm:text-4xl">When is the adventure?</h2>
          <p className="mt-2 text-sm leading-6 text-espresso/60">Choose the dates for your trip. These will create your itinerary days.</p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-xs uppercase tracking-[0.12em]">Start date</Label>
              <Input id="startDate" name="startDate" type="date" value={values.startDate} onChange={(event) => updateValue("startDate", event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-xs uppercase tracking-[0.12em]">End date</Label>
              <Input id="endDate" name="endDate" type="date" min={values.startDate || undefined} value={values.endDate} onChange={(event) => updateValue("endDate", event.target.value)} required />
            </div>
          </div>
        </section>

        <section className={cn("pt-8", step !== 3 && "hidden")} aria-hidden={step !== 3}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-terracotta">Step three</p>
          <h2 className="mt-3 font-heading text-3xl text-burgundy sm:text-4xl">Set the scene</h2>
          <p className="mt-2 text-sm leading-6 text-espresso/60">Add a cover photo to make your trip easy to spot. You can also do this later.</p>
          <div className="mt-8 overflow-hidden rounded-3xl border border-burgundy/10 bg-ivory/65 shadow-soft">
            <div className="flex min-h-56 items-center justify-center bg-sand/35 bg-cover bg-center p-8" style={coverPreview ? { backgroundImage: `linear-gradient(rgba(51,37,31,.16), rgba(51,37,31,.35)), url('${coverPreview}')` } : undefined}>
              {!coverPreview ? <div className="text-center text-espresso/40"><ImageIcon className="mx-auto h-10 w-10" aria-hidden="true" /><p className="mt-3 text-sm font-semibold">Your cover preview</p></div> : null}
            </div>
            <div className="p-5">
              <Label htmlFor="coverPhoto" className="sr-only">Cover photo</Label>
              <FileUpload id="coverPhoto" name="coverPhoto" accept="image/*" buttonText="Choose cover" emptyText={coverName || "No cover selected"} onChange={handleCoverChange} />
              <p className="mt-3 text-xs text-espresso/45">JPG, PNG, GIF, or WebP up to 12 MB.</p>
            </div>
          </div>
        </section>

        <section className={cn("pt-8", step !== 4 && "hidden")} aria-hidden={step !== 4}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-terracotta">Final step</p>
          <h2 className="mt-3 font-heading text-3xl text-burgundy sm:text-4xl">Ready for takeoff?</h2>
          <p className="mt-2 text-sm leading-6 text-espresso/60">Review the essentials before creating your shared trip space.</p>
          <div className="mt-8 overflow-hidden rounded-3xl border border-burgundy/10 bg-ivory shadow-soft">
            <div className="flex min-h-44 items-end bg-gradient-to-br from-terracotta to-burgundy bg-cover bg-center p-5 text-ivory" style={coverPreview ? { backgroundImage: `linear-gradient(180deg, rgba(51,37,31,.05), rgba(51,37,31,.8)), url('${coverPreview}')` } : undefined}>
              <div><h3 className="font-heading text-3xl">{values.name || "Untitled trip"}</h3><p className="mt-1 flex items-center gap-2 text-sm text-ivory/80"><MapPin className="h-4 w-4" aria-hidden="true" />{values.destinations || "Destination pending"}</p></div>
            </div>
            <dl className="grid gap-4 p-5 sm:grid-cols-2">
              <ReviewItem icon={CalendarDays} label="Dates" value={dateSummary} onEdit={() => setStep(2)} />
              <ReviewItem icon={ImageIcon} label="Cover" value={coverName || "Default cover"} onEdit={() => setStep(3)} />
            </dl>
          </div>
        </section>

        <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 border-t border-burgundy/10 bg-ivory/95 p-3 backdrop-blur-xl md:bottom-0">
          <div className="mx-auto flex max-w-3xl justify-end gap-3">
            {step > 1 ? <Button type="button" variant="ghost" onClick={goBack}>Back</Button> : null}
            {step < 4 ? <Button type="button" onClick={goNext} className="min-w-32">Next</Button> : <Button type="submit" className="min-w-40"><Check className="h-4 w-4" aria-hidden="true" />Create Trip</Button>}
          </div>
        </div>
      </form>
    </div>
  );
}

function ReviewItem({ icon: Icon, label, value, onEdit }: { icon: typeof CalendarDays; label: string; value: string; onEdit: () => void }) {
  return <div className="flex items-start gap-3"><span className="rounded-full bg-sand/55 p-2 text-terracotta"><Icon className="h-4 w-4" aria-hidden="true" /></span><div className="min-w-0 flex-1"><dt className="text-xs font-bold uppercase tracking-[0.1em] text-espresso/45">{label}</dt><dd className="mt-1 truncate text-sm font-semibold text-espresso">{value}</dd></div><button type="button" onClick={onEdit} aria-label={`Edit ${label.toLowerCase()}`} className="rounded-full p-2 text-burgundy hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-gold"><PencilLine className="h-4 w-4" aria-hidden="true" /></button></div>;
}

function formatDateSummary(startDate: string, endDate: string) {
  if (!startDate || !endDate) return "Dates not set";
  const formatter = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  return `${formatter.format(new Date(`${startDate}T00:00:00Z`))} – ${formatter.format(new Date(`${endDate}T00:00:00Z`))}`;
}

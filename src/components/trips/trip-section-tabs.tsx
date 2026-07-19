"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Tabs } from "@/components/ui/tabs";

const sectionNames = [
  "itinerary",
  "details",
  "photos",
  "budget",
  "packing",
  "documents",
] as const;

type SectionName = (typeof sectionNames)[number];

function isSectionName(value: string | null): value is SectionName {
  return sectionNames.includes(value as SectionName);
}

export function TripSectionTabs({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionFromUrl = searchParams.get("tab");
  const initialSection = isSectionName(sectionFromUrl) ? sectionFromUrl : "itinerary";
  const [section, setSection] = useState<SectionName>(initialSection);

  useEffect(() => {
    setSection(isSectionName(sectionFromUrl) ? sectionFromUrl : "itinerary");
  }, [sectionFromUrl]);

  function selectSection(value: string) {
    if (!isSectionName(value)) return;

    setSection(value);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", value);
    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
  }

  return (
    <Tabs value={section} onValueChange={selectSection} className={compact ? "mt-0" : "mt-8"}>
      {children}
    </Tabs>
  );
}

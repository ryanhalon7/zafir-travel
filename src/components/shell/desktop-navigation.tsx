"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Camera,
  CircleDollarSign,
  ClipboardList,
  FileText,
  Heart,
  LogOut,
  Luggage,
  Plane,
  Settings,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { signOutAction } from "@/app/actions";
import { cn } from "@/lib/utils";
import darkLogo from "../../../assets/Favicon-Dark.svg";

type DesktopNavigationProps = {
  tripId?: string;
  userEmail: string;
  travelerNames?: string[];
};

type NavigationItem = {
  label: string;
  icon: LucideIcon;
  tab?: "itinerary" | "photos" | "budget" | "packing" | "documents" | "details";
  screen?: "settings" | "partner";
  unavailable?: boolean;
};

const primaryItems: NavigationItem[] = [
  { label: "Trips", icon: Plane },
  { label: "Itinerary", icon: ClipboardList, tab: "itinerary" },
  { label: "Photos", icon: Camera, tab: "photos" },
  { label: "Budget", icon: CircleDollarSign, tab: "budget" },
];

const secondaryItems: NavigationItem[] = [
  { label: "Packing List", icon: Luggage, tab: "packing" },
  { label: "Documents", icon: FileText, tab: "documents" },
  { label: "Wishlist", icon: Heart, unavailable: true },
  { label: "Journal", icon: BookOpen, unavailable: true },
  { label: "Settings", icon: Settings, tab: "details", screen: "settings" },
  { label: "Partner", icon: UserRound, tab: "details", screen: "partner" },
];

export function DesktopNavigation({ tripId, userEmail, travelerNames = [] }: DesktopNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedTab = searchParams.get("tab") ?? "itinerary";
  const selectedScreen = searchParams.get("screen");
  const isTripPage = Boolean(tripId && pathname === `/trips/${tripId}`);
  const people = travelerNames.length ? travelerNames.slice(0, 2) : [displayName(userEmail)];

  function isActive(item: NavigationItem) {
    if (!item.tab) return pathname === "/dashboard" || pathname === "/trips/new";
    return isTripPage && selectedTab === item.tab && (!item.screen || selectedScreen === item.screen);
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[216px] flex-col border-r border-burgundy/10 bg-white md:flex">
      <Link href="/dashboard" className="flex h-[73px] items-center gap-2.5 border-b border-burgundy/10 px-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-muted-gold">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted-gold/15 shadow-soft">
          <Image src={darkLogo} alt="" aria-hidden="true" className="h-7 w-auto" />
        </span>
        <span className="font-heading text-[1.2rem] font-bold leading-none text-burgundy">Zafir Travel</span>
      </Link>

      <div className="border-b border-burgundy/10 bg-[#fbf8f3] px-4 py-4">
        <div className="flex items-center gap-2">
          <AvatarStack names={people} />
          <span className="text-[0.67rem] font-bold text-espresso">Planning together</span>
        </div>
        <p className="mt-2 truncate text-[0.6rem] text-burgundy/60">{people.join(" & ")}</p>
      </div>

      <nav aria-label="Desktop navigation" className="flex-1 overflow-y-auto px-2.5 py-3">
        <NavigationGroup title="Navigation" items={primaryItems} tripId={tripId} isActive={isActive} />
        <div className="my-3 border-t border-burgundy/10" />
        <NavigationGroup title="More" items={secondaryItems} tripId={tripId} isActive={isActive} />
      </nav>

      <div className="border-t border-burgundy/10 p-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#c66a49] to-burgundy text-xs font-bold text-white">
            {initials(displayName(userEmail))}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.68rem] font-bold text-espresso">{displayName(userEmail)}</p>
            <p className="truncate text-[0.56rem] text-burgundy/55">{userEmail}</p>
          </div>
          <form action={signOutAction}>
            <button type="submit" aria-label="Sign out" className="rounded-md p-1.5 text-burgundy/45 transition hover:bg-cream hover:text-burgundy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-gold">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

function NavigationGroup({ title, items, tripId, isActive }: {
  title: string;
  items: NavigationItem[];
  tripId?: string;
  isActive: (item: NavigationItem) => boolean;
}) {
  return (
    <div>
      <p className="px-2 pb-1.5 text-[0.55rem] font-extrabold uppercase tracking-[0.13em] text-espresso">{title}</p>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          const disabled = item.unavailable || Boolean(item.tab && !tripId);
          const content = (
            <>
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-terracotta" : "text-burgundy/65")} strokeWidth={active ? 2.3 : 1.8} />
              <span>{item.label}</span>
              {item.unavailable ? <span className="ml-auto text-[0.5rem] font-medium uppercase tracking-wide text-espresso/30">Soon</span> : null}
            </>
          );

          if (disabled) {
            return <span key={item.label} aria-disabled="true" title={item.unavailable ? `${item.label} is coming soon` : "Open a trip first"} className="flex h-11 items-center gap-3 rounded-xl px-3 text-[0.72rem] font-medium text-espresso/30">{content}</span>;
          }

          const href = item.tab ? `/trips/${tripId}?tab=${item.tab}${item.screen ? `&screen=${item.screen}` : ""}` : "/dashboard";
          return (
            <Link key={item.label} href={href} aria-current={active ? "page" : undefined} className={cn("flex h-11 items-center gap-3 rounded-xl px-3 text-[0.72rem] font-medium text-espresso/75 transition hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-gold", active && "bg-[#ebddd5] font-bold text-terracotta")}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function AvatarStack({ names }: { names: string[] }) {
  return (
    <div className="flex -space-x-1.5" aria-label={names.join(" and ")}>
      {names.map((name, index) => (
        <span key={`${name}-${index}`} className={cn("flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#fbf8f3] text-[0.58rem] font-bold text-white", index % 2 ? "bg-wine" : "bg-[#c66a49]")}>
          {initials(name)}
        </span>
      ))}
    </div>
  );
}

function displayName(email: string) {
  const local = email.split("@")[0] || "Traveler";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

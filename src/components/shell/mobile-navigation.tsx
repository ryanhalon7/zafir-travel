"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Camera,
  CircleDollarSign,
  Ellipsis,
  Map,
  Plane,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type MobileNavigationProps = {
  tripId?: string;
};

type NavItem = {
  label: string;
  icon: LucideIcon;
  tab?: "itinerary" | "photos" | "budget" | "details";
};

const navigationItems: NavItem[] = [
  { label: "Trips", icon: Plane },
  { label: "Itinerary", icon: Map, tab: "itinerary" },
  { label: "Photos", icon: Camera, tab: "photos" },
  { label: "Budget", icon: CircleDollarSign, tab: "budget" },
  { label: "More", icon: Ellipsis, tab: "details" },
];

export function MobileNavigation({ tripId }: MobileNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedTab = searchParams.get("tab") ?? "itinerary";
  const isTripPage = Boolean(tripId && pathname.startsWith(`/trips/${tripId}`));

  function isActive(item: NavItem) {
    if (!item.tab) {
      return pathname === "/dashboard";
    }

    if (!isTripPage) {
      return false;
    }

    if (item.tab === "details") {
      return ["details", "packing", "documents"].includes(selectedTab);
    }

    return selectedTab === item.tab;
  }

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-burgundy/10 bg-ivory/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(95,22,38,0.08)] backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto grid h-[4.5rem] max-w-lg grid-cols-5 px-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          const disabled = Boolean(item.tab && !tripId);
          const href = item.tab ? `/trips/${tripId}?tab=${item.tab}` : "/dashboard";
          const content = (
            <>
              <Icon
                aria-hidden="true"
                className={cn("h-5 w-5", active && "text-terracotta")}
                strokeWidth={active ? 2.4 : 1.8}
              />
              <span className="text-[0.65rem] font-semibold leading-none">{item.label}</span>
              <span
                aria-hidden="true"
                className={cn(
                  "h-1 w-1 rounded-full bg-transparent",
                  active && "bg-terracotta",
                )}
              />
            </>
          );

          if (disabled) {
            return (
              <span
                key={item.label}
                aria-disabled="true"
                className="flex min-w-0 flex-col items-center justify-center gap-1 text-espresso/30"
              >
                {content}
              </span>
            );
          }

          return (
            <Link
              key={item.label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-espresso/55 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-gold focus-visible:ring-inset",
                active && "text-terracotta",
              )}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

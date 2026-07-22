import Image from "next/image";
import { LogOut } from "lucide-react";

import darkLogo from "../../../assets/Favicon-Dark.svg";

import { signOutAction } from "@/app/actions";
import { MobileNavigation } from "@/components/shell/mobile-navigation";
import { DesktopNavigation } from "@/components/shell/desktop-navigation";
import { Button } from "@/components/ui/button";

type AppShellProps = {
  children: React.ReactNode;
  userEmail: string;
  tripId?: string;
  hideMobileHeader?: boolean;
  travelerNames?: string[];
};

export function AppShell({
  children,
  userEmail,
  tripId,
  hideMobileHeader = false,
  travelerNames = [],
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(199,161,90,0.22),_transparent_34%),linear-gradient(180deg,_#fffaf0_0%,_#f8f0e5_48%,_#ead8bf_100%)]">
      <header
        className={`${hideMobileHeader ? "hidden" : "block"} sticky top-0 z-20 border-b border-burgundy/10 bg-ivory/82 backdrop-blur-xl md:hidden`}
      >
        <div className="container flex min-h-20 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted-gold/15 shadow-soft">
              <Image
                src={darkLogo}
                alt=""
                aria-hidden="true"
                className="h-8 w-auto"
              />
            </div>
            <div>
              <p className="font-heading text-2xl leading-none text-burgundy">
                Zafir Travel
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-espresso/55">
                Private trip atelier
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden max-w-[220px] truncate text-sm text-espresso/65 sm:block">
              {userEmail}
            </p>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="icon" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>
      <DesktopNavigation tripId={tripId} userEmail={userEmail} travelerNames={travelerNames} />
      <main className="container pb-28 pt-8 sm:pt-12 md:ml-[216px] md:w-[calc(100%-216px)] md:max-w-none md:px-5 md:pb-12 md:pt-8 lg:px-6">{children}</main>
      <MobileNavigation tripId={tripId} />
    </div>
  );
}

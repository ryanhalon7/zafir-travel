import Image from "next/image";

import darkLogo from "../../assets/Favicon-Dark.svg";

export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-cream/90 px-6 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-ivory shadow-luxe">
          <span className="absolute inset-0 animate-ping rounded-full border border-muted-gold/40" />
          <Image src={darkLogo} alt="" aria-hidden="true" className="h-12 w-auto animate-pulse" />
        </div>
        <p className="mt-5 font-heading text-2xl text-burgundy">Preparing your journey…</p>
        <p className="mt-2 text-sm text-espresso/55">Just a moment</p>
      </div>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";

import logo from "../../../assets/zafir-logo_no-bg (1) 1.svg";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AuthPanelProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footerText: string;
  footerHref: string;
  footerLink: string;
  message?: string;
};

export function AuthPanel({
  title,
  description,
  children,
  footerText,
  footerHref,
  footerLink,
  message,
}: AuthPanelProps) {
  return (
    <main className="grid min-h-screen bg-cream lg:grid-cols-[1.05fr_0.95fr]">
      <section className="zafir-photo-wash relative flex min-h-[34vh] items-end p-8 text-ivory lg:min-h-screen lg:p-14">
        <Image
          src={logo}
          alt="Zafir Travel logo"
          priority
          className="absolute left-4 top-4 h-14 w-14 object-contain sm:left-6 sm:top-6 sm:h-16 sm:w-16 lg:left-8 lg:top-8 lg:h-20 lg:w-20"
        />

        <div className="max-w-xl animate-fade-up">
          {/* <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-gold">
            Zafir Travel
          </p> */}
          <h1 className="font-heading text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">
            Ryan and Moka&apos;s Travel Adventures
          </h1>
        </div>
      </section>
      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            {message ? (
              <div className="mb-5 rounded-lg bg-muted-gold/15 px-4 py-3 text-sm font-medium text-espresso">
                {message}
              </div>
            ) : null}
            {children}
            <p className="mt-6 text-center text-sm text-espresso/65">
              {footerText}{" "}
              <Link className="font-semibold text-burgundy hover:text-wine" href={footerHref}>
                {footerLink}
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

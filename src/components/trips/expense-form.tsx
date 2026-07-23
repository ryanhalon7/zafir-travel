import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createExpenseAction } from "@/app/actions";
import { cn } from "@/lib/utils";

type Member = { id: string; name: string };

const categoryOptions = [
  { value: "LODGING", label: "Accommodation", icon: "🏨" },
  { value: "FOOD", label: "Food", icon: "🍽️" },
  { value: "TRANSPORT", label: "Transport", icon: "🚗" },
  { value: "ACTIVITY", label: "Activities", icon: "🎭" },
  { value: "SHOPPING", label: "Shopping", icon: "🛍️" },
  { value: "OTHER", label: "Other", icon: "🧳" },
];

export function AddExpenseForm({ tripId, currency, members }: { tripId: string; currency: string; members: Member[] }) {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[760px] pb-1">
      <header className="flex min-h-16 items-center gap-3 rounded-2xl border border-burgundy/10 bg-ivory/80 px-4 shadow-[0_3px_10px_rgba(62,38,25,0.04)] sm:px-6">
        <Link href={`/trips/${tripId}?tab=budget&screen=expenses`} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-espresso/75 transition hover:text-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-gold">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <h1 className="font-heading text-[1.25rem] text-espresso">Add Expense</h1>
      </header>

      <form action={createExpenseAction} className="px-1 pt-5">
        <input type="hidden" name="tripId" value={tripId} />
        <input type="hidden" name="isPaid" value="true" />
        <input type="hidden" name="expenseDate" value={today()} />

        <section className="rounded-2xl border border-burgundy/5 bg-white px-5 py-7 text-center shadow-[0_5px_18px_rgba(62,38,25,0.06)]">
          <label htmlFor="expense-amount" className="text-[0.62rem] font-bold uppercase tracking-[0.13em] text-burgundy/75">Amount</label>
          <div className="mx-auto mt-3 flex max-w-[250px] items-center justify-center gap-3">
            <span className="font-heading text-3xl text-espresso" aria-hidden="true">{currencySymbol(currency)}</span>
            <input id="expense-amount" name="amount" type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="0" required className="min-w-0 max-w-[160px] bg-transparent text-center font-heading text-5xl leading-none text-espresso outline-none placeholder:text-espresso/25" />
          </div>
          <p className="sr-only">Currency: {currency}</p>
        </section>

        <div className="mt-5 space-y-4">
          <FieldLabel label="Description" htmlFor="expense-description">
            <input id="expense-description" name="title" type="text" maxLength={120} placeholder="What was this expense for?" required className={inputClass} />
          </FieldLabel>

          <fieldset>
            <legend className={legendClass}>Category</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {categoryOptions.map((category, index) => (
                <label key={category.value} className="relative flex min-h-[62px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-[#dfd1c2] bg-white px-1.5 py-2 text-center text-[0.57rem] font-semibold text-burgundy/75 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft has-[:checked]:border-terracotta has-[:checked]:bg-[#f2e3dc] has-[:checked]:text-terracotta focus-within:ring-2 focus-within:ring-muted-gold active:translate-y-0 active:shadow-inner-soft">
                  <input className="sr-only" type="radio" name="category" value={category.value} defaultChecked={index === 0} />
                  <span className="text-base" aria-hidden="true">{category.icon}</span>
                  <span>{category.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className={legendClass}>Paid by</legend>
            {members.length ? <div className={cn("mt-2 grid gap-2", members.length > 1 && "grid-cols-2")}>
              {members.map((member, index) => (
                <label key={member.id} className="flex min-w-0 cursor-pointer items-center gap-2 rounded-xl border border-[#dfd1c2] bg-white px-3 py-2.5 text-xs font-semibold text-espresso transition has-[:checked]:border-terracotta has-[:checked]:bg-[#f2e3dc] has-[:checked]:text-terracotta focus-within:ring-2 focus-within:ring-muted-gold">
                  <input className="sr-only" type="radio" name="payerId" value={member.id} defaultChecked={index === 0} />
                  <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.62rem] font-bold text-white", index % 2 ? "bg-wine" : "bg-[#c96e48]")}>{initials(member.name)}</span>
                  <span className="min-w-0 truncate">{firstName(member.name)}</span>
                </label>
              ))}
            </div> : <p className="mt-2 rounded-xl border border-terracotta/25 bg-terracotta/5 px-4 py-3 text-xs text-terracotta">Add a traveler before creating an expense.</p>}
          </fieldset>

          <FieldLabel label="Notes (optional)" htmlFor="expense-notes">
            <textarea id="expense-notes" name="notes" maxLength={500} rows={3} placeholder="Any extra details..." className={`${inputClass} min-h-[70px] resize-y py-3`} />
          </FieldLabel>
        </div>

        <footer className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 mt-48 grid grid-cols-[80px_1fr] gap-2 rounded-2xl border border-burgundy/10 bg-[#fbf7f1]/95 p-2.5 shadow-[0_-5px_18px_rgba(62,38,25,0.06)] backdrop-blur md:bottom-0 md:mt-12">
          <Link href={`/trips/${tripId}?tab=budget&screen=expenses`} className="flex h-11 items-center justify-center rounded-xl border border-[#dfd1c2] bg-white text-xs font-semibold text-espresso transition hover:border-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-gold">Cancel</Link>
          <button type="submit" disabled={!members.length} className="h-11 rounded-xl bg-[#cc7048] text-xs font-bold text-white transition hover:bg-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-gold disabled:cursor-not-allowed disabled:opacity-50">Add Expense</button>
        </footer>
      </form>
    </div>
  );
}

function FieldLabel({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return <label htmlFor={htmlFor} className="block"><span className={legendClass}>{label}</span><span className="mt-2 block">{children}</span></label>;
}

const legendClass = "text-[0.62rem] font-bold uppercase tracking-[0.11em] text-burgundy/75";
const inputClass = "h-10 w-full rounded-xl border border-[#dfd1c2] bg-transparent px-3 text-xs text-espresso outline-none transition placeholder:text-burgundy/40 hover:border-muted-gold/70 focus:border-muted-gold focus:shadow-soft focus:ring-2 focus:ring-muted-gold/20";

function today() { return new Date().toISOString().slice(0, 10); }
function firstName(name: string) { return name.includes("@") ? name.split("@")[0] : name.trim().split(/\s+/)[0]; }
function initials(name: string) { return firstName(name).slice(0, 1).toUpperCase() || "?"; }
function currencySymbol(currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "narrowSymbol" }).formatToParts(0).find((part) => part.type === "currency")?.value ?? currency;
  } catch {
    return currency;
  }
}

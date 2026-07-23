import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { updateBudgetSettingsAction } from "@/app/actions";

type CategoryBudgets = {
  accommodation: number | null;
  transport: number | null;
  food: number | null;
  activities: number | null;
  shopping: number | null;
  other: number | null;
};

const categoryFields: Array<{
  key: keyof CategoryBudgets;
  name: string;
  label: string;
  icon: string;
}> = [
  { key: "accommodation", name: "accommodationBudget", label: "Accommodation", icon: "🏨" },
  { key: "transport", name: "transportBudget", label: "Transport", icon: "🚗" },
  { key: "food", name: "foodBudget", label: "Food", icon: "🍽️" },
  { key: "activities", name: "activitiesBudget", label: "Activities", icon: "🎭" },
  { key: "shopping", name: "shoppingBudget", label: "Shopping", icon: "🛍️" },
  { key: "other", name: "otherBudget", label: "Other", icon: "🧳" },
];

export function BudgetSettings({ tripId, budgetAmount, categoryBudgets, currency }: {
  tripId: string;
  budgetAmount: number | null;
  categoryBudgets: CategoryBudgets;
  currency: string;
}) {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[760px] pb-4">
      <header className="flex min-h-16 items-center gap-3 rounded-2xl border border-burgundy/10 bg-ivory/80 px-4 shadow-[0_3px_10px_rgba(62,38,25,0.04)] sm:px-6">
        <Link href={`/trips/${tripId}?tab=budget`} className="inline-flex items-center gap-1 text-xs font-semibold text-espresso/75 transition hover:text-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-gold">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <h1 className="font-heading text-[1.25rem] text-espresso">Budget Settings</h1>
      </header>

      <form action={updateBudgetSettingsAction} className="px-0 py-5 sm:px-6 sm:py-7">
        <input type="hidden" name="tripId" value={tripId} />
        <input type="hidden" name="currency" value={currency} />

        <div>
          <label htmlFor="budgetAmount" className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-burgundy/80">Total trip budget</label>
          <input id="budgetAmount" name="budgetAmount" type="number" min="0.01" step="0.01" defaultValue={budgetAmount ?? ""} required className="mt-2 h-11 w-full rounded-xl border border-[#ddcdbd] bg-transparent px-3 text-sm text-espresso outline-none transition focus:border-muted-gold focus:ring-2 focus:ring-muted-gold/20" />
          <p className="mt-1.5 text-[0.58rem] text-burgundy/50">This is your combined budget for the entire trip.</p>
        </div>

        <div className="my-4 border-t border-burgundy/10" />

        <fieldset>
          <legend className="font-heading text-lg text-espresso">Per-Category Limits</legend>
          <div className="mt-3 space-y-3">
            {categoryFields.map((field) => (
              <div key={field.key} className="grid grid-cols-[30px_1fr] items-end gap-2.5">
                <span className="mb-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[#eee5df] text-sm" aria-hidden="true">{field.icon}</span>
                <label className="block min-w-0 text-[0.62rem] font-semibold text-burgundy/75">
                  <span>{field.label}</span>
                  <input name={field.name} type="number" min="0" step="0.01" defaultValue={categoryBudgets[field.key] ?? ""} className="mt-1 h-9 w-full rounded-xl border border-[#ddcdbd] bg-transparent px-3 text-xs text-espresso outline-none transition focus:border-muted-gold focus:ring-2 focus:ring-muted-gold/20" />
                </label>
              </div>
            ))}
          </div>
        </fieldset>

        <button type="submit" className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-[#cc7048] text-xs font-bold text-white shadow-sm transition hover:bg-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-gold">
          Save Settings
        </button>
      </form>
    </div>
  );
}

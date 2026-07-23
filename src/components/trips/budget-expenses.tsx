"use client";

import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type Expense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  isPaid: boolean;
  expenseDate: string;
  payerName: string;
};

type DisplayCategory = "accommodation" | "food" | "transport" | "activities" | "shopping" | "other";

const categories: Array<{ key: "all" | DisplayCategory; label: string }> = [
  { key: "all", label: "All" },
  { key: "accommodation", label: "Accommodation" },
  { key: "food", label: "Food" },
  { key: "transport", label: "Transport" },
  { key: "activities", label: "Activities" },
  { key: "shopping", label: "Shopping" },
  { key: "other", label: "Other" },
];

const categoryDetails: Record<DisplayCategory, { label: string; icon: string }> = {
  accommodation: { label: "Accommodation", icon: "🏨" },
  food: { label: "Food", icon: "🍽️" },
  transport: { label: "Transport", icon: "🚗" },
  activities: { label: "Activities", icon: "🎭" },
  shopping: { label: "Shopping", icon: "🛍️" },
  other: { label: "Other", icon: "🧳" },
};

export function BudgetExpenses({ tripId, currency, expenses }: { tripId: string; currency: string; expenses: Expense[] }) {
  const [filter, setFilter] = useState<(typeof categories)[number]["key"]>("all");
  const visibleExpenses = useMemo(
    () => filter === "all" ? expenses : expenses.filter((expense) => displayCategory(expense.category) === filter),
    [expenses, filter],
  );
  const total = visibleExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="mx-auto w-full min-w-0 max-w-[860px] pb-4">
      <header className="flex min-h-16 w-full min-w-0 items-center gap-2 rounded-2xl border border-burgundy/10 bg-ivory/80 px-4 shadow-[0_3px_10px_rgba(62,38,25,0.04)] sm:px-6">
        <Link href={`/trips/${tripId}?tab=budget`} className="inline-flex items-center gap-1 text-xs font-semibold text-espresso/75 transition hover:text-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-gold">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <h1 className="min-w-0 truncate font-heading text-[1.25rem] text-espresso">All Expenses</h1>
        <Link href={`/trips/${tripId}?tab=budget&screen=add-expense`} className="ml-auto inline-flex items-center gap-0.5 text-xs font-bold text-terracotta transition hover:text-burgundy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-gold">
          <Plus className="h-3.5 w-3.5" /> Add
        </Link>
      </header>

      <div className="min-w-0 py-4 sm:px-6 sm:py-6">
        <div className="hide-scrollbar flex w-full min-w-0 gap-2 overflow-x-auto overscroll-x-contain pb-1" aria-label="Filter expenses by category">
          {categories.map((category) => {
            const active = category.key === filter;
            return (
              <button key={category.key} type="button" onClick={() => setFilter(category.key)} aria-pressed={active} className={cn("h-9 shrink-0 rounded-full border px-4 text-[0.65rem] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-gold", active ? "border-[#ca6d47] bg-[#ca6d47] text-white" : "border-[#decfbe] bg-transparent text-burgundy/70 hover:border-terracotta/50")}>
                {category.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex min-w-0 items-center justify-between gap-3 text-[0.68rem]">
          <p className="text-burgundy/55">{visibleExpenses.length} {visibleExpenses.length === 1 ? "expense" : "expenses"}</p>
          <p className="shrink-0 font-bold text-espresso">Total: {money(total, currency)}</p>
        </div>

        <div className="mt-3 grid min-w-0 grid-cols-1 gap-2 lg:grid-cols-2">
          {visibleExpenses.length ? visibleExpenses.map((expense) => (
            <ExpenseRow key={expense.id} expense={expense} currency={currency} />
          )) : (
            <div className="rounded-2xl border border-burgundy/10 bg-white px-5 py-10 text-center text-xs text-espresso/55 shadow-[0_3px_10px_rgba(62,38,25,0.06)] lg:col-span-2">
              No expenses in this category yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ExpenseRow({ expense, currency }: { expense: Expense; currency: string }) {
  const category = categoryDetails[displayCategory(expense.category)];
  return (
    <article className="flex min-h-[56px] min-w-0 max-w-full items-center gap-2.5 overflow-hidden rounded-2xl border border-burgundy/10 bg-white px-3 py-2.5 shadow-[0_3px_10px_rgba(62,38,25,0.06)]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f2ece5] text-base" aria-hidden="true">{category.icon}</span>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-xs font-bold text-espresso">{expense.title}</h2>
        <p className="mt-1 truncate text-[0.59rem] text-burgundy/50">
          {category.label.toLowerCase()} · {shortDate(expense.expenseDate)}{expense.isPaid ? "" : " · upcoming"}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs font-bold text-espresso">{money(expense.amount, currency)}</p>
        <p className="mt-1 text-[0.55rem] font-semibold text-terracotta">{firstName(expense.payerName)}</p>
      </div>
    </article>
  );
}

function displayCategory(category: string): DisplayCategory {
  if (category === "LODGING") return "accommodation";
  if (category === "FOOD") return "food";
  if (category === "FLIGHT" || category === "TRANSPORT") return "transport";
  if (category === "ACTIVITY") return "activities";
  if (category === "SHOPPING") return "shopping";
  return "other";
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function firstName(name: string) { return name.includes("@") ? name.split("@")[0] : name.trim().split(/\s+/)[0]; }
function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: value % 1 === 0 ? 0 : 2 }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

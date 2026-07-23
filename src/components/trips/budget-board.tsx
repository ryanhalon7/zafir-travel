import Link from "next/link";
import { ChevronRight, Plus, Settings } from "lucide-react";

import { cn } from "@/lib/utils";

type Member = { id: string; name: string };
type Expense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  isPaid: boolean;
  expenseDate: string;
  dateLabel: string;
  notes: string;
  payerId: string;
  payerName: string;
};

type BudgetCategory = "accommodation" | "transport" | "food" | "activities" | "shopping" | "other";
type CategoryBudgets = Record<BudgetCategory, number | null>;

const categoryDetails: Array<{
  key: BudgetCategory;
  label: string;
  icon: string;
  color: string;
  expenseCategories: string[];
}> = [
  { key: "accommodation", label: "Accommodation", icon: "🏨", color: "#c86d48", expenseCategories: ["LODGING"] },
  { key: "transport", label: "Transport", icon: "🚗", color: "#7d2435", expenseCategories: ["FLIGHT", "TRANSPORT"] },
  { key: "food", label: "Food", icon: "🍽️", color: "#cca640", expenseCategories: ["FOOD"] },
  { key: "activities", label: "Activities", icon: "🎭", color: "#795445", expenseCategories: ["ACTIVITY"] },
  { key: "shopping", label: "Shopping", icon: "🛍️", color: "#684431", expenseCategories: ["SHOPPING"] },
  { key: "other", label: "Other", icon: "🧳", color: "#bea398", expenseCategories: ["OTHER"] },
];

type BudgetBoardProps = {
  tripId: string;
  tripName: string;
  budgetAmount: number | null;
  categoryBudgets: CategoryBudgets;
  currency: string;
  members: Member[];
  expenses: Expense[];
};

export function BudgetBoard({
  tripId,
  tripName,
  budgetAmount,
  categoryBudgets,
  currency,
  members,
  expenses,
}: BudgetBoardProps) {
  const paidExpenses = expenses.filter((expense) => expense.isPaid);
  const totalSpent = sumExpenses(paidExpenses);
  const remaining = budgetAmount === null ? null : budgetAmount - totalSpent;
  const usedPercent = budgetAmount && budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0;
  const categoryRows = categoryDetails.map((category) => ({
    ...category,
    spent: sumExpenses(paidExpenses.filter((expense) => category.expenseCategories.includes(expense.category))),
    budget: categoryBudgets[category.key],
  }));
  const paidByMember = members.map((member) => ({
    ...member,
    paid: sumExpenses(paidExpenses.filter((expense) => expense.payerId === member.id)),
  }));
  const equalShare = members.length ? totalSpent / members.length : 0;
  const settlement = paidByMember
    .map((member) => ({ ...member, balance: member.paid - equalShare }))
    .sort((a, b) => a.balance - b.balance);
  const recentExpenses = paidExpenses.slice(0, 4);

  return (
    <div className="mx-auto w-full min-w-0 max-w-[860px] pb-2">
      <header className="flex min-h-20 items-center justify-between rounded-2xl border border-burgundy/10 bg-ivory/80 px-4 shadow-[0_3px_10px_rgba(62,38,25,0.04)] sm:px-6">
        <div>
          <h1 className="font-heading text-[1.4rem] leading-tight text-espresso">Budget</h1>
          <p className="mt-1 text-xs text-burgundy/65">{tripName}</p>
        </div>
        <Link
          href={`/trips/${tripId}?tab=budget&screen=settings`}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#f2ece4] px-3.5 text-xs font-semibold text-espresso transition hover:bg-sand/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-gold"
        >
          <Settings className="h-3.5 w-3.5 text-[#9b79b1]" />
          Settings
        </Link>
      </header>

      <div className="space-y-6 pt-4 sm:px-1 sm:pt-6">
        <BudgetOverview
          budgetAmount={budgetAmount}
          categoryRows={categoryRows}
          currency={currency}
          remaining={remaining}
          totalSpent={totalSpent}
          usedPercent={usedPercent}
        />

        <section>
          <SectionHeading title="By category" href={`/trips/${tripId}?tab=budget&screen=expenses`} label="See all" />
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {categoryRows.map((category) => (
              <CategoryCard key={category.key} category={category} currency={currency} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-heading text-[1.25rem] text-espresso">Split between us</h2>
          <div className="mt-3 rounded-2xl border border-burgundy/10 bg-white px-4 py-5 shadow-[0_3px_10px_rgba(62,38,25,0.06)]">
            {paidByMember.length ? (
              <div className={cn("grid gap-4", paidByMember.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3")}>
                {paidByMember.map((member, index) => (
                  <div key={member.id} className="text-center">
                    <span className={cn("mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white", index % 2 === 0 ? "bg-[#c96e48]" : "bg-wine")}>
                      {initials(member.name)}
                    </span>
                    <p className="mt-2 font-heading text-xl text-espresso">{money(member.paid, currency)}</p>
                    <p className="mt-0.5 text-[0.65rem] text-burgundy/55">{firstName(member.name)} paid</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-xs text-espresso/55">Add a traveler to calculate the split.</p>
            )}
            <SettlementNotice settlement={settlement} currency={currency} />
          </div>
        </section>

        <section>
          <SectionHeading title="Recent expenses" href={`/trips/${tripId}?tab=budget&screen=expenses`} label={`All ${paidExpenses.length}`} />
          <div className="mt-3 space-y-2">
            {recentExpenses.length ? recentExpenses.map((expense) => (
              <RecentExpense key={expense.id} expense={expense} currency={currency} />
            )) : (
              <div className="rounded-2xl border border-burgundy/10 bg-white px-5 py-8 text-center text-xs text-espresso/55 shadow-[0_3px_10px_rgba(62,38,25,0.06)]">
                No paid expenses yet.
              </div>
            )}
          </div>
        </section>

        <Link
          href={`/trips/${tripId}?tab=budget&screen=add-expense`}
          className="flex h-12 w-full items-center justify-center gap-1 rounded-xl bg-[#cc7048] text-sm font-bold text-white shadow-sm transition hover:bg-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-gold"
        >
          <Plus className="h-4 w-4" /> Add Expense
        </Link>
      </div>
    </div>
  );
}

function BudgetOverview({ budgetAmount, categoryRows, currency, remaining, totalSpent, usedPercent }: {
  budgetAmount: number | null;
  categoryRows: Array<(typeof categoryDetails)[number] & { spent: number; budget: number | null }>;
  currency: string;
  remaining: number | null;
  totalSpent: number;
  usedPercent: number;
}) {
  return (
    <section className="rounded-2xl border border-burgundy/10 bg-white px-4 py-5 shadow-[0_3px_10px_rgba(62,38,25,0.06)] sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.64rem] font-bold uppercase tracking-[0.13em] text-burgundy/75">Total spent</p>
          <p className="mt-2 font-heading text-[1.9rem] leading-none text-espresso">{money(totalSpent, currency)}</p>
          <p className="mt-2 text-[0.67rem] text-burgundy/55">of {budgetAmount === null ? "no budget set" : `${money(budgetAmount, currency)} budget`}</p>
        </div>
        <div className="text-right">
          <p className="text-[0.64rem] font-bold uppercase tracking-[0.13em] text-burgundy/75">{remaining !== null && remaining < 0 ? "Over budget" : "Remaining"}</p>
          <p className={cn("mt-2 font-heading text-[1.65rem] leading-none text-muted-gold", remaining !== null && remaining < 0 && "text-terracotta")}>
            {remaining === null ? "—" : money(Math.abs(remaining), currency)}
          </p>
          <p className="mt-2 text-[0.67rem] text-espresso/75">{budgetAmount ? `${Math.round(usedPercent)}% used` : "Set a budget"}</p>
        </div>
      </div>
      <ProgressBar className="mt-5" percent={usedPercent} color="#c96e48" />
      <div className="mt-7 flex justify-center">
        <DonutChart categories={categoryRows} total={totalSpent} currency={currency} />
      </div>
      <div className="mt-6 flex flex-wrap gap-x-2.5 gap-y-2 text-[0.6rem] text-burgundy/60">
        {categoryRows.map((category) => (
          <span key={category.key} className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: category.color }} />
            {category.label}
          </span>
        ))}
      </div>
    </section>
  );
}

function DonutChart({ categories, total, currency }: {
  categories: Array<(typeof categoryDetails)[number] & { spent: number }>;
  total: number;
  currency: string;
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const gap = total > 0 ? 3 : 0;

  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" aria-label={`Spending by category, ${money(total, currency)} total`} role="img">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#eee7de" strokeWidth="17" />
        {total > 0 && categories.filter((category) => category.spent > 0).map((category) => {
          const length = (category.spent / total) * circumference;
          const circle = (
            <circle key={category.key} cx="70" cy="70" r={radius} fill="none" stroke={category.color} strokeWidth="17" strokeDasharray={`${Math.max(0, length - gap)} ${circumference}`} strokeDashoffset={-offset} />
          );
          offset += length;
          return circle;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[0.55rem] font-bold uppercase tracking-[0.12em] text-burgundy/65">Spent</span>
        <span className="mt-1 font-heading text-sm font-bold text-espresso">{money(total, currency)}</span>
      </div>
    </div>
  );
}

function CategoryCard({ category, currency }: {
  category: (typeof categoryDetails)[number] & { spent: number; budget: number | null };
  currency: string;
}) {
  const percent = category.budget && category.budget > 0 ? (category.spent / category.budget) * 100 : 0;
  const amountRemaining = category.budget === null ? null : category.budget - category.spent;
  const remainingPercent = category.budget && category.budget > 0 ? Math.round((amountRemaining! / category.budget) * 100) : null;

  return (
    <article className="rounded-2xl border border-burgundy/10 bg-white px-3 py-3 shadow-[0_3px_10px_rgba(62,38,25,0.06)]">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f3ede6] text-base" aria-hidden="true">{category.icon}</span>
        <p className="min-w-0 flex-1 truncate text-xs font-bold text-espresso">{category.label}</p>
        <p className="shrink-0 text-[0.68rem] text-burgundy/65"><strong className="text-espresso">{money(category.spent, currency)}</strong>{category.budget !== null ? ` / ${money(category.budget, currency)}` : ""}</p>
      </div>
      <ProgressBar className="mt-2" percent={percent} color={category.color} />
      {remainingPercent !== null && remainingPercent > 0 && remainingPercent <= 20 ? (
        <p className="mt-2 text-[0.58rem] font-semibold text-muted-gold">⚡ {remainingPercent}% remaining</p>
      ) : null}
      {amountRemaining !== null && amountRemaining < 0 ? (
        <p className="mt-2 text-[0.58rem] font-semibold text-terracotta">⚡ {money(Math.abs(amountRemaining), currency)} over budget</p>
      ) : null}
    </article>
  );
}

function RecentExpense({ expense, currency }: { expense: Expense; currency: string }) {
  const detail = categoryDetails.find((category) => category.expenseCategories.includes(expense.category)) ?? categoryDetails[5];
  return (
    <article className="flex items-center gap-3 rounded-2xl border border-burgundy/10 bg-white px-3 py-3 shadow-[0_3px_10px_rgba(62,38,25,0.06)]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f3ede6] text-base" aria-hidden="true">{detail.icon}</span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-xs font-bold text-espresso">{expense.title}</h3>
        <p className="mt-1 truncate text-[0.6rem] text-burgundy/55">{detail.label} · {expense.dateLabel}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs font-bold text-espresso">{money(expense.amount, currency)}</p>
        <p className="mt-1 text-[0.55rem] font-semibold text-terracotta">{firstName(expense.payerName)}</p>
      </div>
    </article>
  );
}

function SectionHeading({ title, href, label }: { title: string; href: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="font-heading text-[1.25rem] text-espresso">{title}</h2>
      <Link href={href} className="inline-flex items-center text-[0.65rem] font-bold text-terracotta hover:text-burgundy">
        {label}<ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function SettlementNotice({ settlement, currency }: { settlement: Array<Member & { paid: number; balance: number }>; currency: string }) {
  if (settlement.length !== 2) return null;
  if (Math.abs(settlement[0].balance) < 0.01) {
    return <p className="mt-4 rounded-lg bg-[#f4efe8] px-3 py-3 text-center text-[0.65rem] text-espresso/65">You&apos;re all settled up</p>;
  }
  return (
    <p className="mt-4 rounded-lg bg-[#f4efe8] px-3 py-3 text-center text-[0.65rem] text-espresso/65">
      {firstName(settlement[0].name)} owes {firstName(settlement[1].name)} <strong className="text-terracotta">{money(Math.abs(settlement[0].balance), currency)}</strong>
    </p>
  );
}

function ProgressBar({ percent, color, className }: { percent: number; color: string; className?: string }) {
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-[#eae2d6]", className)}>
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.min(Math.max(percent, 0), 100)}%`, backgroundColor: color }} />
    </div>
  );
}

function sumExpenses(expenses: Expense[]) { return expenses.reduce((sum, expense) => sum + expense.amount, 0); }
function firstName(name: string) { return name.includes("@") ? name.split("@")[0] : name.trim().split(/\s+/)[0]; }
function initials(name: string) { return firstName(name).slice(0, 1).toUpperCase() || "?"; }
function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: value % 1 === 0 ? 0 : 2 }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

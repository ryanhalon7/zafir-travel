import { ArrowRight, CircleDollarSign, Pencil, Plus, ReceiptText, Trash2, WalletCards } from "lucide-react";

import {
  createExpenseAction,
  deleteExpenseAction,
  updateBudgetSettingsAction,
  updateExpenseAction,
} from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Member = { id: string; name: string };
type Expense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  expenseDate: string;
  dateLabel: string;
  notes: string;
  payerId: string;
  payerName: string;
};

const categories = [
  ["FLIGHT", "Flights"], ["LODGING", "Lodging"], ["FOOD", "Food"],
  ["ACTIVITY", "Activities"], ["TRANSPORT", "Transport"],
  ["SHOPPING", "Shopping"], ["OTHER", "Other"],
];

export function BudgetBoard({ tripId, budgetAmount, currency, members, expenses }: { tripId: string; budgetAmount: number | null; currency: string; members: Member[]; expenses: Expense[] }) {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remaining = budgetAmount === null ? null : budgetAmount - total;
  const progress = budgetAmount ? Math.min((total / budgetAmount) * 100, 100) : 0;
  const paidByMember = members.map((member) => ({
    ...member,
    paid: expenses.filter((expense) => expense.payerId === member.id).reduce((sum, expense) => sum + expense.amount, 0),
  }));
  const share = members.length > 0 ? total / members.length : 0;
  const settlement = members.length === 2
    ? paidByMember.map((member) => ({ ...member, balance: member.paid - share })).sort((a, b) => a.balance - b.balance)
    : [];

  return <div className="space-y-5">
    <div className="grid gap-5 md:grid-cols-3">
      <SummaryCard icon={WalletCards} label="Total spent" value={money(total, currency)} />
      <SummaryCard icon={CircleDollarSign} label="Trip budget" value={budgetAmount === null ? "Not set" : money(budgetAmount, currency)} />
      <SummaryCard icon={ReceiptText} label={remaining !== null && remaining < 0 ? "Over budget" : "Remaining"} value={remaining === null ? "Set a budget" : money(Math.abs(remaining), currency)} alert={remaining !== null && remaining < 0} />
    </div>

    <Card>
      <CardHeader><div className="flex flex-wrap items-start justify-between gap-4"><div><CardTitle>Budget overview</CardTitle><CardDescription>Set the shared target and track how the trip is pacing.</CardDescription></div><details><summary className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-sand px-4 py-2 text-sm font-semibold text-burgundy"><Pencil className="h-4 w-4" />Budget settings</summary><form action={updateBudgetSettingsAction} className="mt-4 grid min-w-[min(78vw,420px)] gap-3 rounded-lg bg-cream p-4 sm:grid-cols-[1fr_110px_auto] sm:items-end"><input type="hidden" name="tripId" value={tripId} /><div className="space-y-2"><Label htmlFor="budgetAmount">Budget amount</Label><Input id="budgetAmount" name="budgetAmount" type="number" min="0.01" step="0.01" defaultValue={budgetAmount ?? ""} placeholder="5000" /></div><div className="space-y-2"><Label htmlFor="currency">Currency</Label><Input id="currency" name="currency" minLength={3} maxLength={3} defaultValue={currency} className="uppercase" required /></div><Button type="submit">Save</Button></form></details></div></CardHeader>
      <CardContent className="space-y-5">
        <div><div className="mb-2 flex justify-between text-sm font-semibold"><span>{Math.round(progress)}% used</span>{budgetAmount ? <span>{money(total, currency)} of {money(budgetAmount, currency)}</span> : null}</div><div className="h-3 overflow-hidden rounded-full bg-sand"><div className={cn("h-full rounded-full bg-muted-gold transition-all", remaining !== null && remaining < 0 && "bg-terracotta")} style={{ width: `${progress}%` }} /></div></div>
        <div className="grid gap-3 sm:grid-cols-2">{paidByMember.map((member) => <div key={member.id} className="rounded-lg bg-cream/75 p-4"><p className="text-xs font-semibold uppercase text-espresso/50">Paid by {member.name}</p><p className="mt-2 font-heading text-2xl text-burgundy">{money(member.paid, currency)}</p></div>)}</div>
        {settlement.length === 2 && Math.abs(settlement[0].balance) >= 0.01 ? <div className="flex flex-wrap items-center justify-center gap-3 rounded-lg bg-muted-gold/15 p-4 text-sm font-semibold text-burgundy"><span>{settlement[0].name}</span><ArrowRight className="h-4 w-4" /><span>{settlement[1].name} {money(Math.abs(settlement[0].balance), currency)}</span></div> : null}
      </CardContent>
    </Card>

    <Card>
      <CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>Expense ledger</CardTitle><CardDescription>{expenses.length} recorded {expenses.length === 1 ? "expense" : "expenses"}.</CardDescription></div><details><summary className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-burgundy px-4 py-2 text-sm font-semibold text-ivory"><Plus className="h-4 w-4" />Add expense</summary><div className="mt-4 min-w-[min(82vw,560px)] rounded-lg bg-cream p-4"><ExpenseForm tripId={tripId} members={members} /></div></details></div></CardHeader>
      <CardContent className="space-y-3">{expenses.length === 0 ? <div className="rounded-lg bg-cream/75 px-5 py-10 text-center text-sm text-espresso/60">No expenses yet.</div> : expenses.map((expense) => <article key={expense.id} className="rounded-lg bg-cream/70 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><Badge>{categoryLabel(expense.category)}</Badge><span className="text-xs text-espresso/50">{expense.dateLabel}</span></div><h3 className="mt-2 font-heading text-2xl text-burgundy">{expense.title}</h3><p className="mt-1 text-sm text-espresso/60">Paid by {expense.payerName}</p></div><p className="font-heading text-2xl text-burgundy">{money(expense.amount, currency)}</p></div>{expense.notes ? <p className="mt-3 text-sm text-espresso/65">{expense.notes}</p> : null}<details className="mt-4"><summary className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-burgundy"><Pencil className="h-4 w-4" />Edit</summary><div className="mt-3 rounded-lg bg-ivory p-4"><ExpenseForm tripId={tripId} members={members} expense={expense} /></div></details></article>)}</CardContent>
    </Card>
  </div>;
}

function SummaryCard({ icon: Icon, label, value, alert }: { icon: typeof WalletCards; label: string; value: string; alert?: boolean }) { return <Card><CardContent className="flex items-center gap-4 p-5"><span className={cn("rounded-full bg-muted-gold/15 p-3 text-burgundy", alert && "bg-terracotta/15 text-terracotta")}><Icon className="h-5 w-5" /></span><div><p className="text-xs font-semibold uppercase text-espresso/50">{label}</p><p className={cn("mt-1 font-heading text-2xl text-burgundy", alert && "text-terracotta")}>{value}</p></div></CardContent></Card>; }

function ExpenseForm({ tripId, members, expense }: { tripId: string; members: Member[]; expense?: Expense }) {
  return <form action={expense ? updateExpenseAction : createExpenseAction} className="grid gap-4"><input type="hidden" name="tripId" value={tripId} />{expense ? <input type="hidden" name="expenseId" value={expense.id} /> : null}<div className="grid gap-3 sm:grid-cols-[1.25fr_0.75fr]"><div className="space-y-2"><Label htmlFor={`${expense?.id ?? "new"}-expense-title`}>Description</Label><Input id={`${expense?.id ?? "new"}-expense-title`} name="title" defaultValue={expense?.title} placeholder="Hotel deposit" required /></div><div className="space-y-2"><Label htmlFor={`${expense?.id ?? "new"}-amount`}>Amount</Label><Input id={`${expense?.id ?? "new"}-amount`} name="amount" type="number" min="0.01" step="0.01" defaultValue={expense?.amount} required /></div></div><div className="grid gap-3 sm:grid-cols-3"><div className="space-y-2"><Label htmlFor={`${expense?.id ?? "new"}-category`}>Category</Label><NativeSelect id={`${expense?.id ?? "new"}-category`} name="category" defaultValue={expense?.category ?? "OTHER"}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</NativeSelect></div><div className="space-y-2"><Label htmlFor={`${expense?.id ?? "new"}-payer`}>Paid by</Label><NativeSelect id={`${expense?.id ?? "new"}-payer`} name="payerId" defaultValue={expense?.payerId ?? members[0]?.id} required>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</NativeSelect></div><div className="space-y-2"><Label htmlFor={`${expense?.id ?? "new"}-date`}>Date</Label><Input id={`${expense?.id ?? "new"}-date`} name="expenseDate" type="date" defaultValue={expense?.expenseDate ?? new Date().toISOString().slice(0, 10)} required /></div></div><div className="space-y-2"><Label htmlFor={`${expense?.id ?? "new"}-notes`}>Notes</Label><Textarea id={`${expense?.id ?? "new"}-notes`} name="notes" maxLength={500} defaultValue={expense?.notes} placeholder="Optional booking or split details" /></div><div className="flex gap-3"><Button type="submit">{expense ? "Save expense" : "Add expense"}</Button>{expense ? <Button type="submit" variant="outline" formAction={deleteExpenseAction}><Trash2 className="h-4 w-4" />Delete</Button> : null}</div></form>;
}

function categoryLabel(value: string) { return categories.find(([category]) => category === value)?.[1] ?? value; }
function money(value: number, currency: string) { try { return new Intl.NumberFormat("en", { style: "currency", currency }).format(value); } catch { return `${currency} ${value.toFixed(2)}`; } }

import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  WalletCards,
} from "lucide-react";

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
  isPaid: boolean;
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
  const paidExpenses = expenses.filter((expense) => expense.isPaid);
  const upcomingExpenses = expenses.filter((expense) => !expense.isPaid);
  const paidTotal = sumExpenses(paidExpenses);
  const upcomingTotal = sumExpenses(upcomingExpenses);
  const projectedTotal = paidTotal + upcomingTotal;
  const remaining = budgetAmount === null ? null : budgetAmount - projectedTotal;
  const progress = budgetAmount ? Math.min((projectedTotal / budgetAmount) * 100, 100) : 0;
  const paidByMember = members.map((member) => ({
    ...member,
    paid: paidExpenses.filter((expense) => expense.payerId === member.id).reduce((sum, expense) => sum + expense.amount, 0),
  }));
  const share = members.length > 0 ? paidTotal / members.length : 0;
  const settlement = members.length === 2
    ? paidByMember.map((member) => ({ ...member, balance: member.paid - share })).sort((a, b) => a.balance - b.balance)
    : [];

  return <div className="space-y-5">
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard icon={WalletCards} label="Paid" value={money(paidTotal, currency)} />
      <SummaryCard icon={CalendarClock} label="Upcoming" value={money(upcomingTotal, currency)} />
      <SummaryCard icon={CircleDollarSign} label="Trip budget" value={budgetAmount === null ? "Not set" : money(budgetAmount, currency)} />
      <SummaryCard icon={ReceiptText} label={remaining !== null && remaining < 0 ? "Projected over" : "Projected remaining"} value={remaining === null ? "Set a budget" : money(Math.abs(remaining), currency)} alert={remaining !== null && remaining < 0} />
    </div>

    <Card>
      <CardHeader><div className="flex flex-wrap items-start justify-between gap-4"><div><CardTitle>Budget overview</CardTitle><CardDescription>Paid and upcoming costs together show where the trip budget is headed.</CardDescription></div><details><summary className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-sand px-4 py-2 text-sm font-semibold text-burgundy"><Pencil className="h-4 w-4" />Budget settings</summary><form action={updateBudgetSettingsAction} className="mt-4 grid min-w-[min(78vw,420px)] gap-3 rounded-lg bg-cream p-4 sm:grid-cols-[1fr_110px_auto] sm:items-end"><input type="hidden" name="tripId" value={tripId} /><div className="space-y-2"><Label htmlFor="budgetAmount">Budget amount</Label><Input id="budgetAmount" name="budgetAmount" type="number" min="0.01" step="0.01" defaultValue={budgetAmount ?? ""} placeholder="5000" /></div><div className="space-y-2"><Label htmlFor="currency">Currency</Label><Input id="currency" name="currency" minLength={3} maxLength={3} defaultValue={currency} className="uppercase" required /></div><Button type="submit">Save</Button></form></details></div></CardHeader>
      <CardContent className="space-y-5">
        <div><div className="mb-2 flex justify-between text-sm font-semibold"><span>{Math.round(progress)}% committed</span>{budgetAmount ? <span>{money(projectedTotal, currency)} of {money(budgetAmount, currency)}</span> : null}</div><div className="h-3 overflow-hidden rounded-full bg-sand"><div className={cn("h-full rounded-full bg-muted-gold transition-all", remaining !== null && remaining < 0 && "bg-terracotta")} style={{ width: `${progress}%` }} /></div></div>
        <div className="grid gap-3 sm:grid-cols-2">{paidByMember.map((member) => <div key={member.id} className="rounded-lg bg-cream/75 p-4"><p className="text-xs font-semibold uppercase text-espresso/50">Paid by {member.name}</p><p className="mt-2 font-heading text-2xl text-burgundy">{money(member.paid, currency)}</p></div>)}</div>
        {settlement.length === 2 && Math.abs(settlement[0].balance) >= 0.01 ? <div className="flex flex-wrap items-center justify-center gap-3 rounded-lg bg-muted-gold/15 p-4 text-sm font-semibold text-burgundy"><span>{settlement[0].name}</span><ArrowRight className="h-4 w-4" /><span>{settlement[1].name} {money(Math.abs(settlement[0].balance), currency)}</span></div> : null}
      </CardContent>
    </Card>

    <Card>
      <CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>Expense ledger</CardTitle><CardDescription>{paidExpenses.length} paid · {upcomingExpenses.length} upcoming.</CardDescription></div><details><summary className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-burgundy px-4 py-2 text-sm font-semibold text-ivory"><Plus className="h-4 w-4" />Add expense</summary><div className="mt-4 min-w-[min(82vw,560px)] rounded-lg bg-cream p-4"><ExpenseForm tripId={tripId} members={members} /></div></details></div></CardHeader>
      <CardContent className="space-y-7">
        <ExpenseSection title="Upcoming expenses" description="Planned costs that have not been paid yet." icon={CalendarClock} expenses={upcomingExpenses} currency={currency} tripId={tripId} members={members} />
        <ExpenseSection title="Paid expenses" description="Completed payments included in traveler settlement." icon={CheckCircle2} expenses={paidExpenses} currency={currency} tripId={tripId} members={members} />
      </CardContent>
    </Card>
  </div>;
}

function ExpenseSection({ title, description, icon: Icon, expenses, currency, tripId, members }: { title: string; description: string; icon: typeof CalendarClock; expenses: Expense[]; currency: string; tripId: string; members: Member[] }) {
  return <section>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-burgundy/10 pb-3"><div className="flex items-center gap-3"><span className="rounded-full bg-muted-gold/15 p-2 text-burgundy"><Icon className="h-4 w-4" /></span><div><h3 className="font-heading text-2xl text-burgundy">{title}</h3><p className="text-xs text-espresso/55">{description}</p></div></div><Badge variant="gold">{money(sumExpenses(expenses), currency)}</Badge></div>
    <div className="space-y-3">{expenses.length === 0 ? <div className="rounded-lg bg-cream/75 px-5 py-8 text-center text-sm text-espresso/60">Nothing here yet.</div> : expenses.map((expense) => <ExpenseCard key={expense.id} expense={expense} currency={currency} tripId={tripId} members={members} />)}</div>
  </section>;
}

function ExpenseCard({ expense, currency, tripId, members }: { expense: Expense; currency: string; tripId: string; members: Member[] }) {
  return <article className={cn("rounded-lg p-4", expense.isPaid ? "bg-cream/70" : "border border-muted-gold/25 bg-muted-gold/5")}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><Badge>{categoryLabel(expense.category)}</Badge><Badge variant="gold">{expense.isPaid ? "Paid" : "Upcoming"}</Badge><span className="text-xs text-espresso/50">{expense.dateLabel}</span></div><h3 className="mt-2 font-heading text-2xl text-burgundy">{expense.title}</h3><p className="mt-1 text-sm text-espresso/60">{expense.isPaid ? "Paid" : "Expected to be paid"} by {expense.payerName}</p></div><p className="font-heading text-2xl text-burgundy">{money(expense.amount, currency)}</p></div>{expense.notes ? <p className="mt-3 text-sm text-espresso/65">{expense.notes}</p> : null}<details className="mt-4"><summary className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-burgundy"><Pencil className="h-4 w-4" />Edit</summary><div className="mt-3 rounded-lg bg-ivory p-4"><ExpenseForm tripId={tripId} members={members} expense={expense} /></div></details></article>;
}

function SummaryCard({ icon: Icon, label, value, alert }: { icon: typeof WalletCards; label: string; value: string; alert?: boolean }) { return <Card><CardContent className="flex items-center gap-4 p-5"><span className={cn("rounded-full bg-muted-gold/15 p-3 text-burgundy", alert && "bg-terracotta/15 text-terracotta")}><Icon className="h-5 w-5" /></span><div><p className="text-xs font-semibold uppercase text-espresso/50">{label}</p><p className={cn("mt-1 font-heading text-2xl text-burgundy", alert && "text-terracotta")}>{value}</p></div></CardContent></Card>; }

function ExpenseForm({ tripId, members, expense }: { tripId: string; members: Member[]; expense?: Expense }) {
  const prefix = expense?.id ?? "new";
  return <form action={expense ? updateExpenseAction : createExpenseAction} className="grid gap-4"><input type="hidden" name="tripId" value={tripId} />{expense ? <input type="hidden" name="expenseId" value={expense.id} /> : null}<div className="grid gap-3 sm:grid-cols-[1.25fr_0.75fr]"><div className="space-y-2"><Label htmlFor={`${prefix}-expense-title`}>Description</Label><Input id={`${prefix}-expense-title`} name="title" defaultValue={expense?.title} placeholder="Hotel deposit" required /></div><div className="space-y-2"><Label htmlFor={`${prefix}-amount`}>Amount</Label><Input id={`${prefix}-amount`} name="amount" type="number" min="0.01" step="0.01" defaultValue={expense?.amount} required /></div></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="space-y-2"><Label htmlFor={`${prefix}-status`}>Payment status</Label><NativeSelect id={`${prefix}-status`} name="isPaid" defaultValue={String(expense?.isPaid ?? true)}><option value="true">Paid</option><option value="false">Upcoming</option></NativeSelect></div><div className="space-y-2"><Label htmlFor={`${prefix}-category`}>Category</Label><NativeSelect id={`${prefix}-category`} name="category" defaultValue={expense?.category ?? "OTHER"}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</NativeSelect></div><div className="space-y-2"><Label htmlFor={`${prefix}-payer`}>{expense?.isPaid === false ? "Expected payer" : "Paid by"}</Label><NativeSelect id={`${prefix}-payer`} name="payerId" defaultValue={expense?.payerId ?? members[0]?.id} required>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</NativeSelect></div><div className="space-y-2"><Label htmlFor={`${prefix}-date`}>{expense?.isPaid === false ? "Due date" : "Date"}</Label><Input id={`${prefix}-date`} name="expenseDate" type="date" defaultValue={expense?.expenseDate ?? new Date().toISOString().slice(0, 10)} required /></div></div><div className="space-y-2"><Label htmlFor={`${prefix}-notes`}>Notes</Label><Textarea id={`${prefix}-notes`} name="notes" maxLength={500} defaultValue={expense?.notes} placeholder="Optional booking or split details" /></div><div className="flex gap-3"><Button type="submit">{expense ? "Save expense" : "Add expense"}</Button>{expense ? <Button type="submit" variant="outline" formAction={deleteExpenseAction}><Trash2 className="h-4 w-4" />Delete</Button> : null}</div></form>;
}

function sumExpenses(expenses: Expense[]) { return expenses.reduce((sum, expense) => sum + expense.amount, 0); }
function categoryLabel(value: string) { return categories.find(([category]) => category === value)?.[1] ?? value; }
function money(value: number, currency: string) { try { return new Intl.NumberFormat("en", { style: "currency", currency }).format(value); } catch { return `${currency} ${value.toFixed(2)}`; } }

import { Check, Circle, Luggage, Pencil, Plus, Trash2, UserRound } from "lucide-react";

import {
  createPackingItemAction,
  deletePackingItemAction,
  togglePackingItemAction,
  updatePackingItemAction,
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
type PackingItem = {
  id: string;
  name: string;
  quantity: number;
  category: string;
  assignedToId: string;
  assignedToName: string;
  notes: string;
  isPacked: boolean;
};

const categories = [
  ["CLOTHING", "Clothing"],
  ["TOILETRIES", "Toiletries"],
  ["DOCUMENTS", "Documents"],
  ["ELECTRONICS", "Electronics"],
  ["MEDICATION", "Medication"],
  ["GEAR", "Gear"],
  ["MISCELLANEOUS", "Miscellaneous"],
];

export function PackingList({ tripId, members, items }: { tripId: string; members: Member[]; items: PackingItem[] }) {
  const packedCount = items.filter((item) => item.isPacked).length;
  const progress = items.length > 0 ? Math.round((packedCount / items.length) * 100) : 0;

  return <div className="space-y-5">
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3"><span className="rounded-full bg-muted-gold/15 p-3 text-burgundy"><Luggage className="h-5 w-5" /></span><div><CardTitle>Shared packing list</CardTitle><CardDescription>{packedCount} of {items.length} items packed.</CardDescription></div></div>
          <details><summary className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-burgundy px-4 py-2 text-sm font-semibold text-ivory shadow-soft"><Plus className="h-4 w-4" />Add item</summary><div className="mt-4 min-w-[min(82vw,560px)] rounded-lg bg-cream p-4"><PackingForm tripId={tripId} members={members} /></div></details>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div><div className="mb-2 flex justify-between text-sm font-semibold text-burgundy"><span>Packing progress</span><span>{progress}%</span></div><div className="h-3 overflow-hidden rounded-full bg-sand"><div className="h-full rounded-full bg-muted-gold transition-all" style={{ width: `${progress}%` }} /></div></div>
        <div className="grid gap-3 sm:grid-cols-2">{members.map((member) => { const assigned = items.filter((item) => item.assignedToId === member.id); const done = assigned.filter((item) => item.isPacked).length; return <div key={member.id} className="flex items-center justify-between rounded-lg bg-cream/75 p-4"><span className="flex items-center gap-2 font-semibold text-burgundy"><UserRound className="h-4 w-4" />{member.name}</span><span className="text-sm text-espresso/55">{done}/{assigned.length} packed</span></div>; })}</div>
      </CardContent>
    </Card>

    {items.length === 0 ? <Card><CardContent className="py-14 text-center"><Luggage className="mx-auto h-10 w-10 text-muted-gold" /><h3 className="mt-4 font-heading text-3xl text-burgundy">Your bags are empty</h3><p className="mt-2 text-sm text-espresso/60">Add the first item to start packing together.</p></CardContent></Card> : categories.map(([value, label]) => {
      const categoryItems = items.filter((item) => item.category === value);
      if (categoryItems.length === 0) return null;
      return <Card key={value}><CardHeader><div className="flex items-center justify-between"><CardTitle>{label}</CardTitle><Badge variant="gold">{categoryItems.filter((item) => item.isPacked).length}/{categoryItems.length}</Badge></div></CardHeader><CardContent className="space-y-2">{categoryItems.map((item) => <article key={item.id} className={cn("rounded-lg bg-cream/70 p-4 transition", item.isPacked && "bg-muted-gold/10")}><div className="flex items-start gap-3"><form action={togglePackingItemAction}><input type="hidden" name="tripId" value={tripId} /><input type="hidden" name="itemId" value={item.id} /><button type="submit" className={cn("mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-burgundy/20 text-burgundy transition hover:bg-sand", item.isPacked && "border-muted-gold bg-muted-gold text-ivory")} aria-label={item.isPacked ? `Mark ${item.name} unpacked` : `Mark ${item.name} packed`}>{item.isPacked ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}</button></form><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className={cn("font-semibold text-burgundy", item.isPacked && "line-through opacity-55")}>{item.name}{item.quantity > 1 ? ` × ${item.quantity}` : ""}</h3><p className="mt-1 text-xs text-espresso/50">{item.assignedToName || "Shared item"}</p></div><Badge>{label}</Badge></div>{item.notes ? <p className="mt-2 text-sm text-espresso/60">{item.notes}</p> : null}<details className="mt-3"><summary className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-burgundy"><Pencil className="h-4 w-4" />Edit</summary><div className="mt-3 rounded-lg bg-ivory p-4"><PackingForm tripId={tripId} members={members} item={item} /></div></details></div></div></article>)}</CardContent></Card>;
    })}
  </div>;
}

function PackingForm({ tripId, members, item }: { tripId: string; members: Member[]; item?: PackingItem }) {
  const prefix = item?.id ?? "new-packing";
  return <form action={item ? updatePackingItemAction : createPackingItemAction} className="grid gap-4"><input type="hidden" name="tripId" value={tripId} />{item ? <input type="hidden" name="itemId" value={item.id} /> : null}<div className="grid gap-3 sm:grid-cols-[1fr_100px]"><div className="space-y-2"><Label htmlFor={`${prefix}-name`}>Item</Label><Input id={`${prefix}-name`} name="name" defaultValue={item?.name} placeholder="Passport" required /></div><div className="space-y-2"><Label htmlFor={`${prefix}-quantity`}>Quantity</Label><Input id={`${prefix}-quantity`} name="quantity" type="number" min={1} max={99} defaultValue={item?.quantity ?? 1} required /></div></div><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor={`${prefix}-category`}>Category</Label><NativeSelect id={`${prefix}-category`} name="category" defaultValue={item?.category ?? "MISCELLANEOUS"}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</NativeSelect></div><div className="space-y-2"><Label htmlFor={`${prefix}-assignee`}>Assigned to</Label><NativeSelect id={`${prefix}-assignee`} name="assignedToId" defaultValue={item?.assignedToId ?? ""}><option value="">Shared / anyone</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</NativeSelect></div></div><div className="space-y-2"><Label htmlFor={`${prefix}-notes`}>Notes</Label><Textarea id={`${prefix}-notes`} name="notes" maxLength={300} defaultValue={item?.notes} placeholder="Optional size, location, or reminder" /></div><div className="flex gap-3"><Button type="submit">{item ? "Save item" : "Add item"}</Button>{item ? <Button type="submit" variant="outline" formAction={deletePackingItemAction}><Trash2 className="h-4 w-4" />Delete</Button> : null}</div></form>;
}

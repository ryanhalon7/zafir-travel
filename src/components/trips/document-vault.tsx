import { Download, FileImage, FileText, FolderLock, ShieldCheck, Trash2, Upload } from "lucide-react";

import { deleteTripDocumentAction, uploadTripDocumentsAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

type DocumentItem = {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
  fileSize: string;
  category: string;
  description: string;
  uploaderName: string;
  createdAt: string;
};

const categories = [
  ["FLIGHT", "Flights"],
  ["LODGING", "Lodging"],
  ["IDENTIFICATION", "Identification"],
  ["INSURANCE", "Insurance"],
  ["RESERVATION", "Reservations"],
  ["TRANSPORT", "Transport"],
  ["OTHER", "Other"],
];

export function DocumentVault({ tripId, documents }: { tripId: string; documents: DocumentItem[] }) {
  return <div className="space-y-5">
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="rounded-full bg-muted-gold/15 p-3 text-burgundy"><FolderLock className="h-5 w-5" /></span>
          <div><CardTitle>Private document vault</CardTitle><CardDescription>Files are stored privately and available only to authenticated trip members.</CardDescription></div>
        </div>
      </CardHeader>
      <CardContent>
        <form action={uploadTripDocumentsAction} className="grid gap-4 lg:grid-cols-[1.2fr_0.7fr_1fr_auto] lg:items-end">
          <input type="hidden" name="tripId" value={tripId} />
          <div className="space-y-2"><Label htmlFor="tripDocuments">Documents</Label><FileUpload id="tripDocuments" name="documents" accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.doc,.docx" multiple required buttonText="Choose documents" emptyText="No documents selected" /></div>
          <div className="space-y-2"><Label htmlFor="documentCategory">Category</Label><NativeSelect id="documentCategory" name="category" defaultValue="OTHER">{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</NativeSelect></div>
          <div className="space-y-2"><Label htmlFor="documentDescription">Description</Label><Input id="documentDescription" name="description" maxLength={300} placeholder="Optional note for these files" /></div>
          <Button type="submit"><Upload className="h-4 w-4" />Upload</Button>
        </form>
        <div className="mt-5 flex items-center gap-2 rounded-lg bg-muted-gold/10 px-4 py-3 text-xs font-semibold text-espresso/60"><ShieldCheck className="h-4 w-4 text-burgundy" />PDF, image, text, and Word files · up to 10 files · 20 MB each</div>
      </CardContent>
    </Card>

    {documents.length === 0 ? <Card><CardContent className="py-16 text-center"><FolderLock className="mx-auto h-10 w-10 text-muted-gold" /><h3 className="mt-4 font-heading text-3xl text-burgundy">The vault is empty</h3><p className="mt-2 text-sm text-espresso/60">Add confirmations, insurance, tickets, or other travel records.</p></CardContent></Card> : categories.map(([category, label]) => {
      const categoryDocuments = documents.filter((document) => document.category === category);
      if (categoryDocuments.length === 0) return null;
      return <Card key={category}><CardHeader><div className="flex items-center justify-between"><CardTitle>{label}</CardTitle><Badge variant="gold">{categoryDocuments.length} {categoryDocuments.length === 1 ? "file" : "files"}</Badge></div></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{categoryDocuments.map((document) => { const Icon = document.mimeType.startsWith("image/") ? FileImage : FileText; return <article key={document.id} className="flex min-w-0 gap-3 rounded-lg bg-cream/70 p-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted-gold/15 text-burgundy"><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h3 className="truncate font-semibold text-burgundy" title={document.fileName}>{document.fileName}</h3>{document.description ? <p className="mt-1 text-sm text-espresso/60">{document.description}</p> : null}<p className="mt-2 text-xs text-espresso/45">{document.fileSize} · {document.uploaderName} · {document.createdAt}</p><div className="mt-3 flex gap-2"><a href={document.url} target="_blank" rel="noreferrer" download={document.fileName} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}><Download className="h-4 w-4" />Open</a><form action={deleteTripDocumentAction}><input type="hidden" name="tripId" value={tripId} /><input type="hidden" name="documentId" value={document.id} /><Button type="submit" size="sm" variant="ghost"><Trash2 className="h-4 w-4" />Delete</Button></form></div></div></article>; })}</CardContent></Card>;
    })}
  </div>;
}

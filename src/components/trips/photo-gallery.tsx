"use client";

import Image from "next/image";
import { Camera, ImagePlus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { deleteTripPhotoAction, uploadTripPhotosAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { Label } from "@/components/ui/label";

type Photo = {
  id: string;
  url: string;
  fileName: string;
  caption: string;
  uploaderName: string;
  createdAt: string;
};

const signedImageLoader = ({ src }: { src: string }) => src;

export function PhotoGallery({ tripId, photos }: { tripId: string; photos: Photo[] }) {
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <span className="rounded-full bg-muted-gold/15 p-3 text-burgundy"><ImagePlus className="h-5 w-5" /></span>
            <div><CardTitle>Add trip memories</CardTitle><CardDescription>Upload up to 12 images at once. Each image can be up to 12 MB.</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent>
          <form action={uploadTripPhotosAction} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <input name="tripId" type="hidden" value={tripId} />
            <div className="space-y-2"><Label htmlFor="tripPhotos">Photos</Label><FileUpload id="tripPhotos" name="photos" accept="image/*" multiple required buttonText="Choose photos" emptyText="No photos selected" /></div>
            <div className="space-y-2"><Label htmlFor="photoCaption">Caption (optional)</Label><Input id="photoCaption" name="caption" maxLength={240} placeholder="Sunset over the Nile" /></div>
            <Button type="submit"><ImagePlus className="h-4 w-4" />Upload</Button>
          </form>
        </CardContent>
      </Card>

      {photos.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-16 text-center"><Camera className="h-10 w-10 text-muted-gold" /><h3 className="mt-4 font-heading text-3xl text-burgundy">No photos yet</h3><p className="mt-2 text-sm text-espresso/60">Add the first memory from this trip.</p></CardContent></Card>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {photos.map((photo) => (
            <article key={photo.id} className="mb-4 break-inside-avoid overflow-hidden rounded-lg bg-ivory shadow-soft">
              <button type="button" onClick={() => setActivePhoto(photo)} className="relative block w-full overflow-hidden bg-sand text-left">
                <Image loader={signedImageLoader} unoptimized src={photo.url} alt={photo.caption || photo.fileName} width={900} height={700} className="h-auto w-full object-cover transition duration-300 hover:scale-[1.02]" />
              </button>
              <div className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">{photo.caption ? <p className="font-semibold text-burgundy">{photo.caption}</p> : null}<p className="mt-1 truncate text-xs text-espresso/50">Added by {photo.uploaderName} · {photo.createdAt}</p></div>
                <form action={deleteTripPhotoAction}>
                  <input name="tripId" type="hidden" value={tripId} /><input name="photoId" type="hidden" value={photo.id} />
                  <Button type="submit" size="icon" variant="ghost" aria-label={`Delete ${photo.caption || photo.fileName}`}><Trash2 className="h-4 w-4" /></Button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}

      {activePhoto ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/90 p-4" role="dialog" aria-modal="true" aria-label={activePhoto.caption || activePhoto.fileName} onClick={() => setActivePhoto(null)}>
          <button type="button" onClick={() => setActivePhoto(null)} className="absolute right-5 top-5 rounded-full bg-ivory/15 p-3 text-ivory" aria-label="Close photo"><X className="h-5 w-5" /></button>
          <div className="max-h-[90vh] max-w-6xl" onClick={(event) => event.stopPropagation()}>
            <Image loader={signedImageLoader} unoptimized src={activePhoto.url} alt={activePhoto.caption || activePhoto.fileName} width={1600} height={1200} className="max-h-[82vh] w-auto rounded-lg object-contain shadow-luxe" />
            {activePhoto.caption ? <p className="mt-3 text-center text-sm font-semibold text-ivory">{activePhoto.caption}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

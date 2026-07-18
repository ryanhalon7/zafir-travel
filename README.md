# Zafir Travel

A private Next.js 14 travel planning app for two people, built with the App Router, TypeScript, Tailwind CSS, shadcn/ui-style components, Supabase, and Prisma/PostgreSQL.

## Phase 1 Foundation

Implemented:

- Supabase auth wiring for email/password sign in and sign up
- Prisma schema for `User`, `Trip`, and `TripMember`
- Two-person invite/pairing flow through trip invite codes
- Protected dashboard with shared trip list
- App shell, auth screens, and reusable shadcn/ui-style primitives
- Warm luxury design tokens, Playfair Display headings, and Montserrat body text
- Supabase storage bucket SQL for future cover, photo, and document uploads

## Phase 2 Trips & Itinerary Core

Implemented:

- Create, edit, and delete trips with destinations, dates, status, and Supabase cover uploads
- Trip workspace with tabbed sections
- Day-by-day itinerary generated from trip dates
- Itinerary event create, edit, and delete
- Drag-and-drop reordering of events within a day
- Development seed trip with realistic Morocco itinerary data

## Phase 3 Calendar & Map Views

Implemented:

- Itinerary, calendar, and map view toggle backed by the same event data
- Month and week calendar views with scheduled events
- Per-day Mapbox view using event latitude and longitude
- Synchronized map pins and itinerary event selection

Set `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` locally and in Vercel to enable maps.

## Phase 4 Trip Photos

Implemented:

- Private shared photo gallery for each trip
- Multi-image uploads with optional captions
- Full-screen photo viewing and member-authorized deletion
- Signed Supabase Storage URLs for private images

## Phase 5 Shared Budget

Implemented:

- Trip budget target and three-letter currency setting
- Categorized expense ledger with payer, date, and notes
- Budget progress, remaining balance, and per-person totals
- Equal-split settlement guidance for two travelers
- Expense editing and deletion

## Phase 6 Shared Packing

Implemented:

- Category-grouped packing checklist with quantities and notes
- Optional traveler assignment or shared ownership
- One-tap packed and unpacked status changes
- Overall and per-traveler packing progress
- Packing item editing and deletion

## Phase 7 Document Vault

Implemented:

- Private, trip-member-only document storage
- Multi-file uploads for PDF, image, text, and Word files
- Categories, descriptions, file metadata, and uploader attribution
- Secure signed downloads from Supabase Storage
- Member-authorized document deletion

## Local Setup

1. Fill `.env.local` with your Supabase project values.
2. Copy `.env.local` to `.env` for Prisma CLI commands.

```powershell
Copy-Item .env.local .env
```

3. Apply the Prisma schema to Supabase Postgres.

```powershell
npx prisma db push
```

4. Apply storage bucket setup.

```powershell
npx prisma db execute --file supabase/storage.sql --schema prisma/schema.prisma
```

5. Verify Phase 1.

```powershell
npm run lint
npm run build
npm run prisma:validate
npm run phase1:db:check
```

After Phase 2 schema is applied, seed development data:

```powershell
npm run phase2:seed
npm run phase2:db:check
```

## Development

```powershell
npm run dev
```

Open `http://localhost:3000`.

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

## Development

```powershell
npm run dev
```

Open `http://localhost:3000`.

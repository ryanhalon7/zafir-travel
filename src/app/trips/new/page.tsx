import { createTripSpaceAction } from "@/app/actions";
import { AppShell } from "@/components/shell/app-shell";
import { NewTripForm } from "@/components/trips/new-trip-form";
import { requireUser } from "@/lib/auth";

type NewTripPageProps = {
  searchParams?: {
    message?: string;
  };
};

export default async function NewTripPage({ searchParams }: NewTripPageProps) {
  const user = await requireUser();

  return (
    <AppShell userEmail={user.email ?? ""} hideMobileHeader>
      <NewTripForm
        createTripAction={createTripSpaceAction}
        message={searchParams?.message}
      />
    </AppShell>
  );
}

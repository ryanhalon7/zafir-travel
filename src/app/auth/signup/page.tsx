import { redirect } from "next/navigation";

import { signUpAction } from "@/app/actions";
import { AuthPanel } from "@/components/shell/auth-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSessionUser } from "@/lib/auth";

type SignUpPageProps = {
  searchParams?: {
    message?: string;
  };
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const user = await getSessionUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthPanel
      title="Create your account"
      description="Start a shared Zafir planning space for two travelers."
      footerText="Already have an account?"
      footerHref="/auth/login"
      footerLink="Sign in"
      message={searchParams?.message}
    >
      <form action={signUpAction} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="displayName">Name</Label>
          <Input id="displayName" name="displayName" autoComplete="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>
        <Button className="w-full" type="submit" size="lg">
          Create account
        </Button>
      </form>
    </AuthPanel>
  );
}

import { redirect } from "next/navigation";

import { signInAction } from "@/app/actions";
import { AuthPanel } from "@/components/shell/auth-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSessionUser } from "@/lib/auth";

type LoginPageProps = {
  searchParams?: {
    message?: string;
  };
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getSessionUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthPanel
      title="Welcome back"
      description="Sign in to your private travel planning space."
      footerText="New to Zafir?"
      footerHref="/auth/signup"
      footerLink="Create an account"
      message={searchParams?.message}
    >
      <form action={signInAction} className="space-y-5">
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
            autoComplete="current-password"
            required
          />
        </div>
        <Button className="w-full" type="submit" size="lg">
          Sign in
        </Button>
      </form>
    </AuthPanel>
  );
}

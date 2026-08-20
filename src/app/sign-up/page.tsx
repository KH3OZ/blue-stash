"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleIcon } from "@/components/icons/google-icon";

type PasswordChecks = {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
};

const PASSWORD_REQUIREMENTS: { key: keyof PasswordChecks; label: string }[] = [
  { key: "minLength", label: "At least 8 characters" },
  { key: "hasUpper", label: "One uppercase letter" },
  { key: "hasLower", label: "One lowercase letter" },
  { key: "hasNumber", label: "One number" },
];

function getPasswordChecks(password: string): PasswordChecks {
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };
}

// Not full RFC 5322 — just enough to catch "missing @", "no domain suffix",
// stray whitespace, etc. before hitting the network.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const emailValid = EMAIL_PATTERN.test(email);
  const passwordChecks = getPasswordChecks(password);
  const passwordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === password;
  const canSubmit = emailValid && passwordValid && passwordsMatch;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

    setIsSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    setConfirmationSent(true);
  }

  async function handleGoogleSignIn() {
    setError(null);
    setIsGoogleLoading(true);

    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    if (oauthError) {
      setIsGoogleLoading(false);
      setError(oauthError.message);
    }
  }

  if (confirmationSent) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 text-center sm:p-8">
          <h1 className="text-xl font-semibold text-foreground">Check your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a confirmation link to <span className="text-foreground">{email}</span>. Confirm your
            address to finish creating your account.
          </p>
          <Link
            href="/sign-in"
            className="mt-6 inline-block text-sm font-medium text-foreground underline underline-offset-2 hover:text-primary"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 sm:p-8">
        <h1 className="text-xl font-semibold text-foreground">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Start stashing what&rsquo;s worth keeping.</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sign-up-email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              id="sign-up-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              aria-invalid={email.length > 0 && !emailValid}
              aria-describedby={email.length > 0 && !emailValid ? "sign-up-email-hint" : undefined}
            />
            {email.length > 0 && !emailValid && (
              <p
                id="sign-up-email-hint"
                role="alert"
                className="flex items-center gap-1.5 text-xs text-destructive"
              >
                <X className="size-3.5" aria-hidden="true" />
                Enter a valid email address.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="sign-up-password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <Input
              id="sign-up-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              aria-invalid={password.length > 0 && !passwordValid}
              aria-describedby={password.length > 0 ? "sign-up-password-requirements" : undefined}
            />
            {password.length > 0 && (
              <ul id="sign-up-password-requirements" className="flex flex-col gap-1">
                {PASSWORD_REQUIREMENTS.map((requirement) => {
                  const met = passwordChecks[requirement.key];
                  const Icon = met ? Check : X;
                  return (
                    <li
                      key={requirement.key}
                      className={cn(
                        "flex items-center gap-1.5 text-xs",
                        met ? "text-green-700 dark:text-green-400" : "text-muted-foreground"
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden="true" />
                      {requirement.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="sign-up-confirm-password" className="text-sm font-medium text-foreground">
              Confirm Password
            </label>
            <Input
              id="sign-up-confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
              aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
              aria-describedby={confirmPassword.length > 0 ? "sign-up-confirm-password-hint" : undefined}
            />
            {confirmPassword.length > 0 && (
              <p
                id="sign-up-confirm-password-hint"
                role={passwordsMatch ? "status" : "alert"}
                className={cn(
                  "flex items-center gap-1.5 text-xs",
                  passwordsMatch ? "text-green-700 dark:text-green-400" : "text-destructive"
                )}
              >
                {passwordsMatch ? (
                  <Check className="size-3.5" aria-hidden="true" />
                ) : (
                  <X className="size-3.5" aria-hidden="true" />
                )}
                {passwordsMatch ? "Passwords match." : "Passwords do not match."}
              </p>
            )}
          </div>

          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="mt-1 w-full" disabled={isSubmitting || !canSubmit}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Creating account…
              </>
            ) : (
              "Sign Up"
            )}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <GoogleIcon className="size-4" />
          )}
          Continue with Google
        </Button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

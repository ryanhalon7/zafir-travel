"use client";

import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

type MutationFeedbackProps = {
  children: React.ReactNode;
  message?: string;
};

export function MutationFeedback({ children, message }: MutationFeedbackProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(message ?? "");

  useEffect(() => {
    if (!message) return;

    setIsSubmitting(false);
    setSuccessMessage(message);

    const timeout = window.setTimeout(() => setSuccessMessage(""), 4000);
    return () => window.clearTimeout(timeout);
  }, [children, message]);

  function handleSubmit(event: React.FormEvent<HTMLDivElement>) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.checkValidity()) return;

    setSuccessMessage("");
    setIsSubmitting(true);
  }

  return (
    <div onSubmitCapture={handleSubmit}>
      {children}

      {isSubmitting ? (
        <div
          className="fixed bottom-5 right-5 z-[70] flex items-center gap-3 rounded-lg bg-espresso px-5 py-4 text-sm font-semibold text-ivory shadow-luxe"
          role="status"
          aria-live="polite"
        >
          <LoaderCircle className="h-5 w-5 animate-spin text-muted-gold" />
          Saving your changes…
        </div>
      ) : null}

      {successMessage ? (
        <div
          className="fixed bottom-5 right-5 z-[70] flex max-w-sm items-center gap-3 rounded-lg bg-burgundy px-5 py-4 text-sm font-semibold text-ivory shadow-luxe"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-muted-gold" />
          {successMessage}
        </div>
      ) : null}
    </div>
  );
}

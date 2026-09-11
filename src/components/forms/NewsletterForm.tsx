import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { newsletterSchema, type NewsletterInput } from "../../lib/validators";
import { classNames } from "../../lib/utils";
import { HoneypotField } from "../ui/Field";

export function NewsletterForm({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterInput>({ resolver: zodResolver(newsletterSchema) });

  async function onSubmit(values: NewsletterInput) {
    if (values.hp_field) return; // bot caught by honeypot — drop silently
    setServerError(null);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: values.full_name,
          email: values.email,
          phone: values.phone || null,
          source: "newsletter_footer",
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "We couldn't save your details right now. Please try again shortly.");
      setStatus("success");
      reset();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "We couldn't save your details right now. Please try again shortly.");
      setStatus("error");
    }
  }

  const inputClass = variant === "dark" ? "input bg-white/10 border-white/20 text-white placeholder:text-ink-400" : "input";
  const labelClass = variant === "dark" ? "sr-only" : "label";

  if (status === "success") {
    return (
      <motion.p
        role="status"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={classNames(
          "flex items-center gap-2 text-sm font-medium",
          variant === "dark" ? "text-brand-300" : "text-success-700"
        )}
      >
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
        You're subscribed! Watch your inbox for updates.
      </motion.p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      <HoneypotField registerProps={register("hp_field")} />
      <div>
        <label htmlFor="nl-name" className={labelClass}>Full name</label>
        <input id="nl-name" className={inputClass} placeholder="Full name" {...register("full_name")} aria-invalid={Boolean(errors.full_name)} />
        {errors.full_name && <p className="field-error" role="alert">{errors.full_name.message}</p>}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="nl-email" className={labelClass}>Email address</label>
          <input id="nl-email" type="email" className={inputClass} placeholder="Email address" {...register("email")} aria-invalid={Boolean(errors.email)} />
          {errors.email && <p className="field-error" role="alert">{errors.email.message}</p>}
        </div>
        <button type="submit" className="btn-primary shrink-0" disabled={isSubmitting}>
          {isSubmitting ? "Joining…" : "Subscribe"}
        </button>
      </div>
      {serverError && (
        <p className={classNames("text-sm", variant === "dark" ? "text-danger-300" : "text-danger-700")} role="alert">
          {serverError}
        </p>
      )}
    </form>
  );
}

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, type ContactInput } from "../../lib/validators";
import { supabase } from "../../lib/supabase";
import { TextField, TextareaField, HoneypotField } from "../ui/Field";
import { Button } from "../ui/Button";
import { SuccessBanner } from "../ui/States";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({ resolver: zodResolver(contactSchema) });

  async function onSubmit(values: ContactInput) {
    if (values.hp_field) return;
    setServerError(null);

    const { error } = await supabase.from("contact_messages").insert({
      name: values.name,
      email: values.email,
      phone: values.phone || null,
      subject: values.subject,
      message: values.message,
    });

    if (error) {
      setServerError("We couldn't send your message right now. Please try again, or reach us directly by phone or email.");
      return;
    }
    setSubmitted(true);
    reset();
  }

  if (submitted) {
    return <SuccessBanner message="Thank you — your message has been received. Someone from our team will get back to you soon." />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <HoneypotField registerProps={register("hp_field")} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Full name" required error={errors.name?.message} {...register("name")} />
        <TextField label="Email address" type="email" required error={errors.email?.message} {...register("email")} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Phone number" hint="Optional" error={errors.phone?.message} {...register("phone")} />
        <TextField label="Subject" required error={errors.subject?.message} {...register("subject")} />
      </div>
      <TextareaField label="Message" required error={errors.message?.message} {...register("message")} />
      {serverError && (
        <p role="alert" className="text-sm text-danger-700">
          {serverError}
        </p>
      )}
      <Button type="submit" loading={isSubmitting}>
        Send message
      </Button>
    </form>
  );
}

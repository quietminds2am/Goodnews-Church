import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useLocation } from "react-router-dom";
import { loginSchema, type LoginInput } from "../../lib/validators";
import { useAuth } from "../../context/AuthContext";
import { TextField } from "../../components/ui/Field";
import { Button } from "../../components/ui/Button";
import { Seo } from "../../components/seo/Seo";
import { BrandLogo } from "../../components/layout/BrandLogo";
import { ShieldCheck } from "lucide-react";

export default function Login() {
  const { session, admin, signIn } = useAuth();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  if (session && admin) {
    const from = (location.state as { from?: string })?.from ?? "/admin";
    return <Navigate to={from} replace />;
  }

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const { error } = await signIn(values.email, values.password);
    if (error) setServerError(error);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-12">
      <Seo title="Admin Login" path="/admin/login" noindex />
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <BrandLogo />
        </div>
        <div className="card p-8">
          <div className="mb-6 flex items-center gap-2 text-ink-500">
            <ShieldCheck className="h-5 w-5 text-brand-600" aria-hidden />
            <h1 className="text-lg font-semibold text-ink-900">Admin Sign In</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <TextField
              label="Email address"
              type="email"
              autoComplete="email"
              required
              error={errors.email?.message}
              {...register("email")}
            />
            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              error={errors.password?.message}
              {...register("password")}
            />
            {serverError && (
              <p role="alert" className="text-sm text-danger-700">
                {serverError}
              </p>
            )}
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Sign In
            </Button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-ink-400">This area is restricted to authorized church administrators.</p>
      </div>
    </div>
  );
}

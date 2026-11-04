import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  Lock,
  UserRound,
  LoaderCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

import Logo from "../components/logo";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/useAuth";
import useTheme from "../context/useTheme";

export default function Register() {
  const { register } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const headingClass = isDark ? "text-white" : "text-slate-900";
  const descriptionClass = isDark ? "text-slate-300" : "text-slate-600";

  const inputClass =
    "auth-input w-full rounded-xl border border-slate-300 bg-white py-4 pl-11 pr-4 text-sm text-black caret-black outline-none placeholder:text-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500";

  const passwordChecks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];

  const passwordStrength = passwordChecks.filter(Boolean).length;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][
    passwordStrength
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (fullName.trim().length < 2) {
      setError("Full name must contain at least 2 characters.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
      });

      navigate("/login", {
        replace: true,
        state: {
          registered: true,
          email: email.trim(),
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to create your account. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page relative isolate min-h-dvh overflow-hidden p-3 sm:flex sm:items-center sm:justify-center sm:p-6">
      {/* <div className="absolute right-5 top-5 z-30 sm:right-8 sm:top-8">
        <ThemeToggle />
      </div> */}

      <Link
        to="/"
        className="auth-back-link absolute left-5 top-5 z-30 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-sm backdrop-blur transition sm:left-8 sm:top-8"
      >
        <ArrowLeft size={16} />
        Back to home
      </Link>

      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />

      <div className="auth-card relative mx-auto flex min-h-155 w-full max-w-5xl overflow-hidden rounded-3xl border backdrop-blur-xl sm:min-h-140">
        {/* Branding panel */}
        <section className="auth-brand-panel relative hidden w-[42%] flex-col items-center justify-center px-8 text-center sm:flex">
          <div className="relative z-10 flex flex-col items-center">
            <div className="auth-logo-card relative z-10 mb-5 rounded-2xl border p-3 shadow-lg">
              <Logo size={58} showText={false} />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Doc Intellect AI
            </h1>

            <p className="mt-3 max-w-xs text-sm leading-6 text-slate-600 dark:text-slate-200">
              Your AI-powered
              <br />
              document assistant
            </p>

            <div className="auth-art relative mt-10 rounded-2xl p-5">
              <div className="flex h-24 w-32 items-center justify-center rounded-xl bg-white shadow-sm">
                <div className="space-y-2">
                  <div className="h-2 w-20 rounded-full bg-violet-200" />
                  <div className="h-2 w-24 rounded-full bg-violet-200" />
                  <div className="h-2 w-16 rounded-full bg-violet-200" />
                  <div className="h-2 w-20 rounded-full bg-violet-200" />
                </div>
              </div>

              <Sparkles
                size={22}
                className="absolute -right-3 top-1/2 text-violet-400"
              />
            </div>

            <p className="mt-6 text-xs font-medium tracking-wide text-violet-600 dark:text-violet-300">
              YOUR DOCUMENTS. YOUR AI ASSISTANT.
            </p>
          </div>
        </section>

        {/* Register form */}
        <section className="relative z-10 flex flex-1 items-center justify-center px-5 py-12 sm:px-10 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-7 flex flex-col items-center sm:items-start">
              <div className="mb-4 sm:hidden">
                <Logo size={48} />
              </div>

              <h2
                className={`text-2xl font-bold tracking-tight ${headingClass}`}
              >
                Create Account
              </h2>

              <p className={`mt-1 text-sm ${descriptionClass}`}>
                Get started with Doc Intellect AI
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="auth-error mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full name */}
              <label className="relative block">
                <UserRound
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name"
                  autoComplete="name"
                  minLength={2}
                  maxLength={100}
                  required
                  className={inputClass}
                />
              </label>

              {/* Email */}
              <label className="relative block">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  autoComplete="email"
                  required
                  className={inputClass}
                />
              </label>

              {/* Password */}
              <div>
                <label className="relative block">
                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (at least 8 characters)"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                    className={`${inputClass} pr-12`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-violet-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </label>

                {/* Password strength */}
                {password && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            passwordStrength >= level
                              ? passwordStrength <= 1
                                ? "bg-red-400"
                                : passwordStrength === 2
                                  ? "bg-amber-400"
                                  : passwordStrength === 3
                                    ? "bg-emerald-400"
                                    : "bg-violet-500"
                              : isDark
                                ? "bg-slate-700"
                                : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>

                    <p className={`text-xs ${descriptionClass}`}>
                      Password strength:{" "}
                      <span className={`font-medium ${headingClass}`}>
                        {strengthLabel}
                      </span>
                    </p>

                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {[
                        ["8+ characters", passwordChecks[0]],
                        ["Uppercase", passwordChecks[1]],
                        ["Number", passwordChecks[2]],
                        ["Symbol", passwordChecks[3]],
                      ].map(([label, passed]) => (
                        <span
                          key={label}
                          className={`flex items-center gap-1 text-[11px] ${
                            passed
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          <CheckCircle2 size={12} />
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <label className="relative block">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  required
                  className={inputClass}
                />
              </label>

              {confirmPassword && (
                <p
                  className={`-mt-2 text-xs ${
                    password === confirmPassword
                      ? "text-emerald-600 dark:text-emerald-400"
                      : descriptionClass
                  }`}
                >
                  {password === confirmPassword
                    ? "Passwords match"
                    : "Passwords do not match"}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="auth-submit flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-violet-600 via-purple-600 to-indigo-600 py-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && (
                  <LoaderCircle size={17} className="animate-spin" />
                )}
                {submitting ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className={`mt-7 text-center text-sm ${descriptionClass}`}>
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-violet-600 transition hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
              >
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
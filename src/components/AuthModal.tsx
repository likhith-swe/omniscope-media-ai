"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { X, Mail, Loader2, KeyRound } from "lucide-react";
import { useUI } from "@/components/UIProvider";

export default function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { user, refreshUser } = useUI();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const reset = () => {
    setStep("email");
    setCode("");
    setError(null);
    setNote(null);
    setBusy(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submitEmail = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch("/api/auth/magic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as {
        instant?: boolean;
        sent?: boolean;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      if (data.instant) {
        await refreshUser();
        router.refresh();
        close();
        return;
      }
      setNote("A 6-digit code is on its way. It expires in 10 minutes.");
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      await refreshUser();
      router.refresh();
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="relative w-full max-w-sm rounded-xl border border-white/[0.08] bg-surface p-6 shadow-2xl shadow-black/60"
          >
            <button
              onClick={close}
              className="absolute right-4 top-4 text-faint transition hover:text-ink"
              aria-label="Close sign-in dialog"
            >
              <X size={16} />
            </button>

            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber">
              OmniScope account
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              {step === "email" ? "Sign in or create an account" : "Enter your code"}
            </h2>
            <p className="mt-1 text-sm text-mute">
              {step === "email"
                ? "One-click Google or a passwordless email code. Your lookups, saved titles and Pro pass live here."
                : `We sent a 6-digit code to ${email}.`}
            </p>

            {user && (
              <p className="mt-3 rounded-md border border-white/[0.08] bg-raised px-3 py-2 text-xs text-mute">
                Already signed in as <span className="text-ink">{user.email}</span>.
              </p>
            )}

            {step === "email" ? (
              <form onSubmit={submitEmail} className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = "/api/auth/google";
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-raised px-4 py-2.5 text-sm font-medium transition hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                    <path
                      fill="#EA4335"
                      d="M12 5.04c1.62 0 3.06.56 4.2 1.64l3.12-3.12C17.46 1.8 14.96.75 12 .75 7.55.75 3.73 3.3 1.86 7.02l3.66 2.84C6.4 7.02 8.98 5.04 12 5.04z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.25 12.27c0-.82-.07-1.6-.21-2.36H12v4.48h6.32c-.27 1.46-1.1 2.7-2.35 3.53l3.6 2.79c2.1-1.94 3.68-4.8 3.68-8.44z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.52 14.14A6.9 6.9 0 0 1 5.15 12c0-.75.13-1.47.36-2.14L1.86 7.02A11.2 11.2 0 0 0 .75 12c0 1.8.43 3.5 1.11 4.98l3.66-2.84z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23.25c3.02 0 5.56-1 7.41-2.71l-3.6-2.79c-1 .67-2.3 1.07-3.81 1.07-3.02 0-5.6-1.98-6.48-4.68l-3.66 2.84c1.87 3.72 5.69 6.27 10.14 6.27z"
                    />
                  </svg>
                  Continue with Google
                </button>

                <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-widest text-faint">
                  <span className="h-px flex-1 bg-white/[0.08]" />
                  or
                  <span className="h-px flex-1 bg-white/[0.08]" />
                </div>

                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-white/[0.08] bg-obsidian px-9 py-2.5 text-sm placeholder:text-faint"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-obsidian transition hover:bg-amber-bright disabled:opacity-60"
                >
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
                  Email me a sign-in code
                </button>
              </form>
            ) : (
              <form onSubmit={submitCode} className="mt-5 space-y-3">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full rounded-lg border border-white/[0.08] bg-obsidian px-4 py-2.5 text-center font-mono text-lg tracking-[0.5em] placeholder:text-faint"
                />
                <button
                  type="submit"
                  disabled={busy || code.length !== 6}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-obsidian transition hover:bg-amber-bright disabled:opacity-60"
                >
                  {busy && <Loader2 size={15} className="animate-spin" />}
                  Verify and sign in
                </button>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="w-full text-center text-xs text-faint transition hover:text-mute"
                >
                  Use a different email
                </button>
              </form>
            )}

            {error && (
              <p className="mt-3 rounded-md border border-signal/30 bg-signal/10 px-3 py-2 text-xs text-signal">
                {error}
              </p>
            )}
            {note && !error && (
              <p className="mt-3 rounded-md border border-jade/25 bg-jade/10 px-3 py-2 text-xs text-jade">
                {note}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

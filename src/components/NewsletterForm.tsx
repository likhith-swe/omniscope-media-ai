"use client";

import { useState, type FormEvent } from "react";
import { Loader2, MailCheck, Send } from "lucide-react";

export default function NewsletterForm({ sourcePage }: { sourcePage: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, sourcePage }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        subscribed?: boolean;
        alreadySubscribed?: boolean;
        reactivated?: boolean;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      if (data.alreadySubscribed) setDone("You are already on the list. See you Friday.");
      else if (data.reactivated) setDone("Subscription reactivated. Welcome back.");
      else setDone("Confirmed. The Friday Movie Drop and your free-to-stream alerts are live.");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Subscription failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MailCheck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-white/[0.08] bg-obsidian py-2.5 pl-9 pr-3 text-sm placeholder:text-faint focus:border-amber/40"
            aria-label="Email address"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="flex items-center gap-1.5 rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-obsidian transition hover:bg-amber-bright disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Notify me
        </button>
      </div>
      {done && <p className="mt-2 text-xs text-jade">{done}</p>}
      {error && <p className="mt-2 text-xs text-signal">{error}</p>}
      <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
        Weekly Friday Movie Drop · one sponsor slot per issue · unsubscribe anytime
      </p>
    </form>
  );
}

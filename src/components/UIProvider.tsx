"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import AuthModal from "@/components/AuthModal";
import PricingModal from "@/components/PricingModal";

export interface PublicUser {
  email: string;
  fullName: string;
  isPro: boolean;
}

interface UIContextValue {
  user: PublicUser | null;
  refreshUser: () => Promise<void>;
  openAuth: () => void;
  openPricing: () => void;
  closeModals: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside <UIProvider>");
  return ctx;
}

/**
 * Session state for the navigation chrome. Pages stay fully static; the
 * provider probes /api/me once on hydration and again after auth events.
 */
export function UIProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      const data = (await res.json()) as { user: PublicUser | null };
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const openAuth = useCallback(() => {
    setPricingOpen(false);
    setAuthOpen(true);
  }, []);
  const openPricing = useCallback(() => {
    setAuthOpen(false);
    setPricingOpen(true);
  }, []);
  const closeModals = useCallback(() => {
    setAuthOpen(false);
    setPricingOpen(false);
  }, []);

  const value = useMemo(
    () => ({ user, refreshUser, openAuth, openPricing, closeModals }),
    [user, refreshUser, openAuth, openPricing, closeModals]
  );

  return (
    <UIContext.Provider value={value}>
      {children}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
    </UIContext.Provider>
  );
}

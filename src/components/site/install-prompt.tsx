"use client";

import { useEffect, useState } from "react";
import { Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "glownest_install_dismissed";

/**
 * Invites phone visitors to install GlowNest to their home screen. Android fires
 * `beforeinstallprompt` and gets a real install button; iOS has no such API, so it gets the
 * Share-sheet instructions instead.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY)) return;
    } catch {
      return;
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const timer = isIos ? window.setTimeout(() => setShowIosHint(true), 4000) : undefined;

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Private browsing — just hide it for this session.
    }
    setDeferred(null);
    setShowIosHint(false);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  }

  if (!deferred && !showIosHint) return null;

  return (
    <div className="fixed inset-x-3 bottom-20 z-50 md:hidden">
      <div className="bg-card flex items-center gap-3 rounded-xl border p-3 shadow-lg">
        {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size app icon */}
        <img src="/images/icon-192.png" alt="" className="size-11 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Add GlowNest to your home screen</p>
          {showIosHint ? (
            <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
              Tap <Share className="size-3.5" /> then &ldquo;Add to Home Screen&rdquo;
            </p>
          ) : (
            <p className="text-muted-foreground mt-0.5 text-xs">Book in one tap, like an app</p>
          )}
        </div>
        {deferred && (
          <Button size="sm" className="h-9 shrink-0" onClick={install}>
            Install
          </Button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground -m-1 shrink-0 p-1"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

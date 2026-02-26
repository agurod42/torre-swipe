"use client";

import { useEffect } from "react";
import { useSwipeStore } from "../store/swipeStore";

const AUTO_DISMISS_MS = 1500;

export function CelebrationOverlay() {
  const { setCelebrating } = useSwipeStore();

  useEffect(() => {
    const timer = setTimeout(() => setCelebrating(false), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [setCelebrating]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Super like celebration"
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
      onClick={() => setCelebrating(false)}
    >
      <div className="text-center pointer-events-none">
        <div className="text-8xl mb-4 animate-star-burst">⭐</div>
        <p className="text-3xl font-bold text-white">Super Like! 🌟</p>
      </div>
    </div>
  );
}

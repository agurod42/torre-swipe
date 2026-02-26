"use client";

import { useSwipeStore } from "../store/swipeStore";
import { useDragCard } from "../hooks/useDragCard";

// Footer structure copied from references/ui/home-screen.html: <footer class="px-6 pb-12 pt-6 ...">
export function ActionBar() {
  const { isAnimating } = useSwipeStore();
  const { triggerSwipe } = useDragCard();

  const disabledCls = isAnimating ? "opacity-40 pointer-events-none" : "";

  return (
    <footer className={`px-6 pb-12 pt-6 flex justify-center items-center gap-6 ${disabledCls}`}>
      {/* Pass button — references/ui/home-screen.html */}
      <button
        aria-label="Pass this job"
        onClick={() => triggerSwipe("left")}
        disabled={isAnimating}
        className="w-14 h-14 rounded-full bg-card-dark-lighter btn-glow-red flex items-center justify-center text-rose-500 active:scale-90 transition-transform"
      >
        <span className="material-symbols-outlined text-3xl font-bold">close</span>
      </button>

      {/* Like button — references/ui/home-screen.html */}
      <button
        aria-label="Like this job"
        onClick={() => triggerSwipe("right")}
        disabled={isAnimating}
        className="w-20 h-20 rounded-full bg-primary shadow-2xl shadow-primary/40 flex items-center justify-center text-bg-midnight active:scale-90 transition-transform"
      >
        <span
          className="material-symbols-outlined text-4xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          favorite
        </span>
      </button>

      {/* Super like button — references/ui/home-screen.html (Torre logo SVG) */}
      <button
        aria-label="Super like this job"
        onClick={() => triggerSwipe("up")}
        disabled={isAnimating}
        className="w-14 h-14 rounded-full bg-card-dark-lighter btn-glow-torre flex items-center justify-center text-primary active:scale-90 transition-transform"
      >
        <svg
          className="w-8 h-8 fill-current drop-shadow-[0_0_5px_rgba(204,220,57,0.6)]"
          viewBox="0 0 24 24"
        >
          {/* Torre logo path — from references/ui/home-screen.html */}
          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" />
        </svg>
      </button>
    </footer>
  );
}

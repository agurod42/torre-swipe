"use client";

import { useEffect } from "react";
import Image from "next/image";
import { LocalStorageStrategy } from "@torre-swipe/torre-client";
import { useSwipeStore, initSwipeStore } from "../store/swipeStore";
import { useDragCard } from "../hooks/useDragCard";
import { SwipeStack } from "../components/SwipeStack";
import { ActionBar } from "../components/ActionBar";
import { CelebrationOverlay } from "../components/CelebrationOverlay";

// Initialise storage once (module-level so it runs once on client mount)
let storageInitialised = false;

function useStorageInit() {
  useEffect(() => {
    if (!storageInitialised) {
      storageInitialised = true;
      initSwipeStore(new LocalStorageStrategy());
    }
  }, []);
}

// Header — structure from references/ui/home-screen.html: <header>
function Header() {
  const { undoCard, isAnimating } = useSwipeStore();
  const { undo } = useSwipeStore();
  const canUndo = !!undoCard && !isAnimating;

  return (
    <header className="flex justify-between items-center px-6 py-4">
      {/* Logo + title */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-primary/40">
          <Image
            src="/header-icon.jpg"
            alt="Torre Swipe icon"
            width={36}
            height={36}
            className="w-full h-full object-cover"
            priority
          />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white glow-text-primary">
          Torre Swipe
        </h1>
      </div>

      {/* Undo button — references/ui/home-screen.html */}
      <button
        aria-label="Undo last swipe"
        aria-disabled={!canUndo}
        onClick={canUndo ? undo : undefined}
        className={`w-10 h-10 bg-card-dark-lighter rounded-full flex items-center justify-center border border-white/5 transition-all
          ${canUndo
            ? "text-slate-400 active:scale-95 cursor-pointer"
            : "text-slate-500 opacity-50 cursor-not-allowed"
          }`}
      >
        <span className="material-symbols-outlined">undo</span>
      </button>
    </header>
  );
}

export default function HomePage() {
  useStorageInit();

  const { queue, isAnimating, isCelebrating } = useSwipeStore();
  const { triggerSwipe } = useDragCard();
  const { undo } = useSwipeStore();

  // Keyboard navigation — spec §12.1
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isAnimating) return;
      // Ignore when focus is on an input/button (let default behavior handle it)
      if (
        e.target instanceof HTMLButtonElement ||
        e.target instanceof HTMLInputElement
      )
        return;

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          triggerSwipe("right");
          break;
        case "ArrowLeft":
          e.preventDefault();
          triggerSwipe("left");
          break;
        case "ArrowUp":
          e.preventDefault();
          triggerSwipe("up");
          break;
        case "z":
        case "Z":
          e.preventDefault();
          undo();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAnimating, triggerSwipe, undo]);

  return (
    // App shell — omits the phone-frame chrome from the HTML reference
    // Uses max-w-[400px] mx-auto as specified in the plan
    <div className="flex flex-col h-dvh max-w-[400px] mx-auto relative overflow-hidden">
      {/* Google Material Symbols font — same as references/ui/ */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
      />

      <Header />

      <SwipeStack />

      {/* Action bar — only shown when there are cards (EmptyState renders its own disabled footer) */}
      {queue.length > 0 && <ActionBar />}

      {/* Celebration overlay */}
      {isCelebrating && <CelebrationOverlay />}

      {/* Home indicator bar — from references/ui/home-screen.html */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/10 rounded-full" />
    </div>
  );
}

"use client";

// Structure copied from references/ui/empty-screen.html — <main> and <footer> elements

type Props = {
  onRefresh: () => void;
};

export function EmptyState({ onRefresh }: Props) {
  return (
    <>
      {/* Main — references/ui/empty-screen.html: main.flex-1.flex.flex-col... */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full scale-150" />
          <span className="text-8xl relative z-10 glow-emoji">🎉</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{"You've seen all jobs!"}</h2>
        <p className="text-slate-400 text-base mb-10 max-w-[240px] leading-relaxed">
          Check back later for more opportunities.
        </p>
        <button
          onClick={onRefresh}
          className="group relative flex items-center gap-3 bg-primary px-8 py-4 rounded-2xl text-bg-midnight font-bold text-lg active:scale-95 transition-all btn-refresh-shadow"
        >
          <span className="material-symbols-outlined font-bold group-active:rotate-180 transition-transform duration-500">
            refresh
          </span>
          Refresh
        </button>
      </main>

      {/* Disabled action bar — references/ui/empty-screen.html: footer.opacity-40 */}
      <footer className="px-6 pb-12 pt-6 flex justify-center items-center gap-6 opacity-40 grayscale-[0.5]">
        <button
          aria-label="Pass this job"
          disabled
          className="w-14 h-14 rounded-full bg-card-dark-lighter border border-rose-500/20 flex items-center justify-center text-rose-500/50 cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-3xl font-bold">close</span>
        </button>
        <button
          aria-label="Like this job"
          disabled
          className="w-20 h-20 rounded-full bg-primary/50 flex items-center justify-center text-bg-midnight/50 cursor-not-allowed"
        >
          <span
            className="material-symbols-outlined text-4xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            favorite
          </span>
        </button>
        <button
          aria-label="Super like this job"
          disabled
          className="w-14 h-14 rounded-full bg-card-dark-lighter border border-blue-500/20 flex items-center justify-center text-blue-400/50 cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-3xl font-bold">grade</span>
        </button>
      </footer>
    </>
  );
}

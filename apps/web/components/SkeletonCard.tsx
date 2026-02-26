"use client";

// Skeleton mirrors the banner + content structure from references/ui/home-screen.html
// using .shimmer CSS class (gradient sweep animation defined in globals.css)
export function SkeletonCard() {
  return (
    <div className="relative z-10 w-full h-full bg-card-dark rounded-[32px] card-shadow-vibrant border border-white/10 overflow-hidden flex flex-col">
      {/* Banner skeleton */}
      <div className="h-44 bg-slate-800 relative overflow-hidden">
        <div className="shimmer absolute inset-0" />
        {/* Logo placeholder */}
        <div className="absolute bottom-4 left-4">
          <div className="w-14 h-14 bg-slate-700 rounded-xl shimmer" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="p-6 flex-1 flex flex-col gap-3">
        {/* Title */}
        <div className="h-7 w-3/4 bg-slate-700 rounded-lg shimmer" />
        <div className="h-5 w-1/2 bg-slate-700 rounded-lg shimmer" />

        {/* Meta rows */}
        <div className="mt-2 flex flex-col gap-2">
          <div className="h-4 w-2/3 bg-slate-700 rounded shimmer" />
          <div className="h-4 w-1/2 bg-slate-700 rounded shimmer" />
          <div className="h-4 w-1/3 bg-slate-700 rounded shimmer" />
        </div>

        {/* Skill chips */}
        <div className="mt-4 flex gap-2">
          <div className="h-7 w-16 bg-slate-700 rounded-full shimmer" />
          <div className="h-7 w-20 bg-slate-700 rounded-full shimmer" />
          <div className="h-7 w-14 bg-slate-700 rounded-full shimmer" />
        </div>
      </div>
    </div>
  );
}

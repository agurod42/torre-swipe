"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { MotionValue } from "framer-motion";
import type { Opportunity } from "@torre-swipe/types";

// ── Salary formatting ──────────────────────────────────────────────────────────
function formatK(n: number): string {
  return n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
}

function formatSalary(opp: Opportunity): string {
  const { compensation } = opp;
  if (!compensation.visible) return "Salary not disclosed";
  const { code, minAmount, maxAmount, currency, periodicity } = compensation.data;
  const symbol = currency === "USD" ? "$" : currency;
  if (code === "range") {
    return `${symbol}${formatK(minAmount)} – ${symbol}${formatK(maxAmount)} / ${periodicity}`;
  }
  return `${symbol}${formatK(minAmount)} / ${periodicity}`;
}

// ── Skill chip colors ─────────────────────────────────────────────────────────
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash);
}

const CHIP_CLASSES = [
  "bg-cyan-950/40 border border-neon-cyan/30 text-neon-cyan",      // cyan
  "bg-fuchsia-950/40 border border-neon-magenta/30 text-neon-magenta", // magenta
  "bg-amber-950/40 border border-neon-amber/30 text-neon-amber",   // amber
] as const;

function skillChipClass(name: string): string {
  return CHIP_CLASSES[simpleHash(name) % 3];
}

// ── Types ─────────────────────────────────────────────────────────────────────
type Props = {
  job: Opportunity;
  likeOpacity?: MotionValue<number>;
  nopeOpacity?: MotionValue<number>;
  superOpacity?: MotionValue<number>;
  isTop?: boolean;
};

// ── Component ─────────────────────────────────────────────────────────────────
export function JobCard({ job, likeOpacity, nopeOpacity, superOpacity, isTop = false }: Props) {
  const org = job.organizations[0];
  const companyName = org?.name ?? "Unknown Company";
  const visibleSkills = job.skills.slice(0, 3);
  const overflowCount = job.skills.length - 3;
  const locationText =
    job.locations.length > 0 ? job.locations.join(", ") : "Location not specified";
  const salaryText = formatSalary(job);
  const salaryParts = salaryText.split(" / ");

  return (
    // Card structure replicated from references/ui/home-screen.html — div.relative.z-10
    <article
      role="article"
      aria-label={`${job.objective} at ${companyName}`}
      tabIndex={0}
      className="relative z-10 w-full h-full bg-card-dark rounded-[32px] card-shadow-vibrant border border-white/10 overflow-hidden flex flex-col"
    >
      {/* Banner area — references/ui/home-screen.html: div.h-44 */}
      <div className="h-44 bg-slate-900 relative overflow-hidden">
        {org?.picture && (
          <Image
            src={org.picture}
            alt={companyName}
            fill
            className="object-cover opacity-60"
            priority={isTop}
            sizes="400px"
          />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card-dark via-transparent to-transparent" />
        {/* Company logo — bottom-left of banner */}
        <div className="absolute bottom-4 left-4 flex items-center gap-3">
          <div className="w-14 h-14 bg-white rounded-xl p-2 shadow-xl">
            {org?.picture ? (
              <Image
                src={org.picture}
                alt={`${companyName} logo`}
                width={48}
                height={48}
                className="object-contain w-full h-full"
              />
            ) : (
              <svg viewBox="0 0 24 24" className="w-full h-full text-slate-400 fill-current">
                <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Content area — references/ui/home-screen.html: div.p-6 */}
      <div className="p-6 flex-1 flex flex-col overflow-hidden">
        {/* Title row */}
        <div className="flex justify-between items-start mb-1">
          <h2 className="text-2xl font-bold leading-tight text-white line-clamp-2 flex-1 mr-2">
            {job.objective}
          </h2>
          {job.remote && (
            <span className="text-primary font-bold text-[10px] tracking-widest uppercase bg-primary/20 border border-primary/30 px-2.5 py-1 rounded-lg shrink-0">
              Remote
            </span>
          )}
        </div>

        {/* Company name */}
        <p className="text-slate-400 font-medium mb-4">{companyName}</p>

        {/* Salary row */}
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary text-xl">payments</span>
          {job.compensation.visible && salaryParts.length === 2 ? (
            <>
              <span className="text-lg font-semibold text-white">{salaryParts[0]}</span>
              <span className="text-slate-500 text-sm">/ {salaryParts[1]}</span>
            </>
          ) : (
            <span className="text-slate-500 text-sm">{salaryText}</span>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 mb-2 text-slate-400 text-sm">
          <span className="material-symbols-outlined text-base">location_on</span>
          <span className="line-clamp-1">{locationText}</span>
        </div>

        {/* Commitment */}
        {job.commitment && (
          <div className="flex items-center gap-2 mb-4 text-slate-400 text-sm">
            <span className="material-symbols-outlined text-base">schedule</span>
            <span className="capitalize">{job.commitment.replace("-", " ")}</span>
          </div>
        )}

        {/* Tagline */}
        {job.tagline && (
          <p className="text-slate-400 text-sm line-clamp-3 mb-4 flex-1">{job.tagline}</p>
        )}

        {/* Skills */}
        {visibleSkills.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3">
              Required Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {visibleSkills.map((skill) => (
                <span
                  key={skill.name}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold ${skillChipClass(skill.name)}`}
                >
                  {skill.name}
                </span>
              ))}
              {overflowCount > 0 && (
                <span className="px-3.5 py-1.5 bg-slate-800/60 border border-white/10 text-slate-300 rounded-full text-xs font-semibold">
                  +{overflowCount}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Drag overlay stamps */}
      {isTop && likeOpacity && nopeOpacity && superOpacity && (
        <>
          {/* LIKE stamp — top-left, rotated -20° */}
          <motion.div
            className="absolute top-8 left-6 border-[3px] border-green-500 text-green-500 rounded-md px-3 py-1 font-bold text-2xl uppercase pointer-events-none"
            style={{ opacity: likeOpacity, rotate: -20 }}
          >
            LIKE
          </motion.div>
          {/* NOPE stamp — top-right, rotated +20° */}
          <motion.div
            className="absolute top-8 right-6 border-[3px] border-red-500 text-red-500 rounded-md px-3 py-1 font-bold text-2xl uppercase pointer-events-none"
            style={{ opacity: nopeOpacity, rotate: 20 }}
          >
            NOPE
          </motion.div>
          {/* SUPER stamp — centered */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-[3px] border-blue-500 text-blue-500 rounded-md px-3 py-1 font-bold text-2xl uppercase pointer-events-none"
            style={{ opacity: superOpacity }}
          >
            SUPER
          </motion.div>
        </>
      )}
    </article>
  );
}

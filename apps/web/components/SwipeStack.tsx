"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useSwipeStore } from "../store/swipeStore";
import { useSwipeQueue } from "../hooks/useSwipeQueue";
import { useDragCard } from "../hooks/useDragCard";
import { SkeletonCard } from "./SkeletonCard";
import { EmptyState } from "./EmptyState";

const JobCard = dynamic(
  () => import("./JobCard").then((m) => ({ default: m.JobCard })),
  { ssr: false },
);

// Back-card decorative div structure replicated from references/ui/home-screen.html
// div.absolute.inset-x-6.top-1/2.-translate-y-[calc(50%+16px)].h-[72%]...
function BackCard() {
  return (
    <div className="absolute inset-x-6 top-1/2 -translate-y-[calc(50%+16px)] h-[72%] bg-card-dark/40 rounded-[32px] scale-95 origin-bottom border border-white/5" />
  );
}

export function SwipeStack() {
  const { queue, isFetching } = useSwipeStore();
  const { fetchMore } = useSwipeQueue();
  const dragCard = useDragCard();
  const { x, y, rotate, likeOpacity, nopeOpacity, superOpacity, controls, handleDragEnd } =
    dragCard;

  // Loading state — initial fetch in flight
  if (isFetching && queue.length === 0) {
    return (
      <div className="flex-1 relative px-4 flex flex-col justify-center">
        <BackCard />
        <div className="relative z-10 w-full h-[85%]">
          <SkeletonCard />
        </div>
      </div>
    );
  }

  // Empty state — queue exhausted
  if (queue.length === 0) {
    return <EmptyState onRefresh={() => fetchMore(20)} />;
  }

  const topJob = queue[0];

  return (
    // main from references/ui/home-screen.html: main.flex-1.relative.px-4.flex.flex-col.justify-center
    <div className="flex-1 relative px-4 flex flex-col justify-center">
      {/* Back decorative card */}
      <BackCard />

      {/* Top card — draggable */}
      <motion.div
        className="relative z-10 w-full h-[85%]"
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.9}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x, y, rotate, willChange: "transform" }}
        whileTap={{ cursor: "grabbing" }}
      >
        <JobCard
          key={topJob.id}
          job={topJob}
          likeOpacity={likeOpacity}
          nopeOpacity={nopeOpacity}
          superOpacity={superOpacity}
          isTop
        />
      </motion.div>
    </div>
  );
}

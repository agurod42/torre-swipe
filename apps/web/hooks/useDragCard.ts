"use client";

import { useRef } from "react";
import {
  useMotionValue,
  useTransform,
  useAnimation,
} from "framer-motion";
import { useSwipeStore } from "../store/swipeStore";
import { logger } from "../lib/logger";
import { openExternalApplication } from "../lib/externalApplication";

type Direction = "left" | "right" | "up";

const THROW_THRESHOLD_X = 100;
const THROW_THRESHOLD_Y = -100;
const EXIT_X = typeof window !== "undefined" ? window.innerWidth + 300 : 800;
const EXIT_Y = typeof window !== "undefined" ? -(window.innerHeight + 300) : -1000;
const SPRING = { type: "spring" as const, stiffness: 400, damping: 30 };
const INSTANT = { duration: 0 };

export function useDragCard() {
  const { swipe, setAnimating, isAnimating } = useSwipeStore();
  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-20, 20]);

  // Overlay opacities driven by motion values (no re-render during drag)
  const likeOpacity = useTransform(x, [0, 80], [0, 1], { clamp: true });
  const nopeOpacity = useTransform(x, [-80, 0], [1, 0], { clamp: true });
  const superOpacity = useTransform(y, [-80, 0], [1, 0], { clamp: true });

  const controls = useAnimation();
  const animatingRef = useRef(false);

  const springConfig = prefersReducedMotion ? INSTANT : SPRING;

  async function exitCard(direction: Direction): Promise<void> {
    if (animatingRef.current) return;
    animatingRef.current = true;
    setAnimating(true);

    if (direction === "right" || direction === "up") {
      const topCard = useSwipeStore.getState().queue[0];
      openExternalApplication(topCard?.externalApplicationUrl);
    }

    const targetX =
      direction === "right" ? EXIT_X : direction === "left" ? -EXIT_X : 0;
    const targetY = direction === "up" ? EXIT_Y : -30;
    const targetRotate =
      direction === "right" ? 20 : direction === "left" ? -20 : 0;

    logger.info("exitCard", { direction, targetX, targetY });

    await controls.start({
      x: targetX,
      y: targetY,
      rotate: targetRotate,
      transition: prefersReducedMotion ? INSTANT : { ...SPRING, duration: 0.4 },
    });

    swipe(
      direction === "right" ? "like" : direction === "left" ? "pass" : "super",
    );

    // Reset motion values for next card
    x.set(0);
    y.set(0);
    await controls.start({ x: 0, y: 0, rotate: 0, transition: { duration: 0 } });

    setAnimating(false);
    animatingRef.current = false;
  }

  function handleDragEnd(_: unknown, info: { offset: { x: number; y: number } }): void {
    const { x: ox, y: oy } = info.offset;
    logger.info("handleDragEnd", { offsetX: ox, offsetY: oy });

    if (oy < THROW_THRESHOLD_Y && Math.abs(ox) < Math.abs(oy)) {
      void exitCard("up");
    } else if (ox > THROW_THRESHOLD_X) {
      void exitCard("right");
    } else if (ox < -THROW_THRESHOLD_X) {
      void exitCard("left");
    } else {
      // Spring back
      logger.info("handleDragEnd: spring back");
      void controls.start({ x: 0, y: 0, rotate: 0, transition: springConfig });
    }
  }

  function triggerSwipe(direction: Direction): void {
    if (isAnimating || animatingRef.current) return;
    void exitCard(direction);
  }

  return {
    x,
    y,
    rotate,
    likeOpacity,
    nopeOpacity,
    superOpacity,
    controls,
    handleDragEnd,
    triggerSwipe,
  };
}

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Delay in seconds before the animation starts. */
  delay?: number;
  /** Initial vertical offset in px (slide-up distance). */
  y?: number;
  className?: string;
}

/**
 * Fade + slide-up when the element scrolls into view.
 * Respects prefers-reduced-motion (renders final state instantly).
 * Content is always present in the DOM (only opacity/transform animate),
 * so crawlers and the SPA initial render are unaffected.
 */
export function Reveal({ children, delay = 0, y = 24, className }: RevealProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  /** Seconds between each child's animation. */
  step?: number;
}

/** Wrapper that staggers the reveal of its <Reveal> children. */
export function Stagger({ children, className, step = 0.12 }: StaggerProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: reduce ? 0 : step } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** A single item to place inside <Stagger>. */
export function StaggerItem({
  children,
  className,
  y = 24,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduce ? {} : { opacity: 0, y },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export const EASING = {
  ENTER:  "power3.out",
  EXIT:   "power2.in",
  SCRUB:  "none",
  SMOOTH: "cubic-bezier(0.16, 1, 0.3, 1)",
} as const;

export const DURATION = {
  FAST:    0.3,
  DEFAULT: 0.6,
  SLOW:    1.0,
  OVERLAY: 0.7,
} as const;

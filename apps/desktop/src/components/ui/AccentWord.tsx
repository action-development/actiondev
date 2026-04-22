interface AccentWordProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Display-headline accent. Replaces the italic-accent cliché with a
 * typographic family contrast (mono + uppercase + tracking) against Syne.
 * Inline element — use inside a .display-xl / .display-l.
 */
export function AccentWord({ children, className = "" }: AccentWordProps) {
  return (
    <span className={`accent-word ${className}`}>{children}</span>
  );
}

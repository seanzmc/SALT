import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type SlideOverPanelProps = {
  open: boolean;
  expanded?: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  zIndexClassName?: string;
};

export function SlideOverPanel({
  open,
  expanded = false,
  onClose,
  children,
  className,
  zIndexClassName
}: SlideOverPanelProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div className={joinClasses("fixed inset-0", zIndexClassName ?? "z-50")}>
      <button
        aria-label="Close panel"
        className="absolute inset-0 bg-slate-950/24 backdrop-blur-[2px] animate-[overlay-fade_180ms_ease-out]"
        onClick={onClose}
        type="button"
      />
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-4 sm:pl-6">
        <div
          className={joinClasses(
            "h-full border-l border-border/70 bg-[hsl(var(--background))] shadow-[-28px_0_80px_-48px_rgba(15,23,42,0.55)] animate-[shelf-in_220ms_cubic-bezier(0.2,0.8,0.2,1)]",
            expanded
              ? "w-screen sm:w-[min(76rem,calc(100vw-1rem))]"
              : "w-screen sm:w-[min(42rem,calc(100vw-1rem))] xl:w-[min(48rem,calc(100vw-2rem))]",
            className
          )}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

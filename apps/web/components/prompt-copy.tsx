"use client";

import { useState } from "react";

export function PromptCopy({ text }: { text: string }): JSX.Element {
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("ok");
      window.setTimeout(() => setStatus("idle"), 1600);
    } catch {
      setStatus("err");
      window.setTimeout(() => setStatus("idle"), 1600);
    }
  };

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={copy}
        className="rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-accent-contrast transition hover:brightness-95"
      >
        Copy prompt
      </button>
      {status !== "idle" ? (
        <span
          role="status"
          aria-live="polite"
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 rounded-lg border border-border bg-surface px-3 py-1 text-xs text-text shadow-card"
        >
          {status === "ok" ? "Copied" : "Copy failed"}
        </span>
      ) : null}
    </div>
  );
}

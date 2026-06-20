import Link from "next/link";

import { ThemeToggle } from "./theme-toggle";

export function AppShell({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only">
        Skip to main content
      </a>
      <header className="sticky top-0 z-20 border-b border-border/80 bg-bg/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-semibold tracking-tight text-text">
            Prompt Gallery
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/browse"
              className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-text-muted transition hover:border-accent hover:text-accent"
            >
              Browse
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>
      <main id="main" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
      <footer className="mx-auto mt-10 max-w-7xl border-t border-border px-4 py-8 text-sm text-text-muted sm:px-6 lg:px-8">
        <p>Data is sourced from community repos and licensed under CC BY 4.0 with attribution.</p>
      </footer>
    </div>
  );
}

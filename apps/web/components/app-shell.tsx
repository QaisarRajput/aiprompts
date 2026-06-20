import Image from "next/image";
import Link from "next/link";

import { MobileNav } from "./mobile-nav";
import { NavDropdown } from "./nav-dropdown";
import { ThemeToggle } from "./theme-toggle";

function InstagramIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

function XIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function FacebookIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function TikTokIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.74a4.85 4.85 0 01-1.01-.05z"/>
    </svg>
  );
}

const SOCIAL_LINKS = [
  { href: "https://instagram.com/aipromptshub", label: "Instagram", Icon: InstagramIcon },
  { href: "https://x.com/aipromptshub", label: "X (Twitter)", Icon: XIcon },
  { href: "https://facebook.com/aipromptshub", label: "Facebook", Icon: FacebookIcon },
  { href: "https://tiktok.com/@aipromptshub", label: "TikTok", Icon: TikTokIcon }
];

export function AppShell({
  children,
  categories = []
}: {
  children: React.ReactNode;
  categories?: string[];
}): JSX.Element {
  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only">
        Skip to main content
      </a>
      <header className="sticky top-0 z-20 border-b border-border/80 bg-bg/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          {/* Logo — light/dark swap */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/logo.png"
              alt="AI Prompts"
              width={200}
              height={58}
              className="h-[4.5rem] w-auto dark:hidden"
              priority
            />
            <Image
              src="/logo-dark.png"
              alt="AI Prompts"
              width={200}
              height={58}
              className="hidden h-[4.5rem] w-auto dark:block"
              priority
            />
          </Link>

          {/* Center nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            <Link
              href="/browse"
              className="rounded-xl px-3 py-1.5 text-sm font-medium text-text-muted transition hover:bg-surface-muted hover:text-text"
            >
              Browse
            </Link>
            <NavDropdown categories={categories} />
            <Link
              href="/browse/gpt-image-2"
              className="rounded-xl px-3 py-1.5 text-sm font-medium text-text-muted transition hover:bg-surface-muted hover:text-text"
            >
              GPT Image
            </Link>
            <Link
              href="/browse/seedance-2"
              className="rounded-xl px-3 py-1.5 text-sm font-medium text-text-muted transition hover:bg-surface-muted hover:text-text"
            >
              Seedance
            </Link>
            {/* Divider */}
            <div className="mx-2 h-4 w-px bg-border" />
            {/* Function CTA */}
            <Link
              href="/browse"
              className="rounded-xl bg-accent px-4 py-1.5 text-sm font-semibold text-accent-contrast shadow-sm transition hover:brightness-95 active:scale-95"
            >
              Browse All →
            </Link>
          </div>

          {/* Right — coffee + social + theme + burger */}
          <div className="flex items-center gap-1">
            {/* Buy me a coffee — desktop only */}
            <a
              href="https://buymeacoffee.com/aipromptshub"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 dark:bg-amber-400/10 dark:text-amber-400 dark:hover:bg-amber-400/20"
            >
              ☕ Buy me a coffee
            </a>
            <div className="mx-1 hidden lg:block h-4 w-px bg-border" />
            {/* Social icons — hide on very small screens */}
            {SOCIAL_LINKS.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="hidden sm:flex rounded-lg p-1.5 text-text-muted transition hover:text-accent"
              >
                <Icon />
              </a>
            ))}
            <div className="mx-1 hidden sm:block h-4 w-px bg-border" />
            <ThemeToggle />
            {/* Burger — mobile only */}
            <MobileNav categories={categories} />
          </div>
        </nav>
      </header>

      <main id="main" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Image
                src="/logo.png"
                alt="AI Prompts"
                width={160}
                height={46}
                className="h-[3.75rem] w-auto opacity-80 dark:hidden"
              />
              <Image
                src="/logo-dark.png"
                alt="AI Prompts"
                width={160}
                height={46}
                className="hidden h-[3.75rem] w-auto opacity-80 dark:block"
              />
              <p className="mt-2 max-w-xs text-sm text-text-muted">
                The most fire AI image prompts on the internet. Curated daily.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Follow us</p>
              <div className="flex items-center gap-3">
                {SOCIAL_LINKS.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="rounded-lg p-1.5 text-text-muted transition hover:text-accent"
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-1 border-t border-border pt-6 text-xs text-text-muted sm:flex-row sm:justify-between">
            <p>© {new Date().getFullYear()} AI Prompts. All rights reserved.</p>
            <p>
              Prompt data sourced from community repos &amp; licensed under{" "}
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                className="hover:text-accent underline underline-offset-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                CC BY 4.0
              </a>
              .
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

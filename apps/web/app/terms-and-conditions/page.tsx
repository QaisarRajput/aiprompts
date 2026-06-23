import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for using AI Prompts Hub."
};

export default function TermsAndConditionsPage(): JSX.Element {
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-text">Terms &amp; Conditions</h1>
        <p className="text-sm text-text-muted">Last updated: June 23, 2026</p>
      </header>

      <div className="space-y-5 text-sm leading-7 text-text-muted">
        <p>
          By accessing and using AI Prompts, you agree to use the website lawfully and in compliance with all
          applicable regulations.
        </p>

        <h2 className="text-lg font-semibold text-text">1. Content and Attribution</h2>
        <p>
          Prompt data is aggregated from community-maintained sources. Attribution is provided where available.
          Third-party content remains the property of its original creators.
        </p>

        <h2 className="text-lg font-semibold text-text">2. Acceptable Use</h2>
        <p>
          You may browse, copy, and remix prompts for personal or commercial workflows, but you must not misuse
          the site, attempt unauthorized access, or republish content in a way that violates upstream licenses.
        </p>

        <h2 className="text-lg font-semibold text-text">3. External Links</h2>
        <p>
          The site may contain links to third-party platforms. We are not responsible for the content, availability,
          or practices of those external sites.
        </p>

        <h2 className="text-lg font-semibold text-text">4. Disclaimer</h2>
        <p>
          This website is provided on an "as is" basis without warranties of any kind. We do not guarantee
          completeness, uptime, or fitness for a specific purpose.
        </p>

        <h2 className="text-lg font-semibold text-text">5. Changes</h2>
        <p>
          We may update these terms at any time. Continued use of the site after updates means you accept the
          revised terms.
        </p>
      </div>
    </section>
  );
}

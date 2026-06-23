import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Policies",
  description: "Privacy, cookies, and content policies for AI Prompts Hub."
};

export default function PoliciesPage(): JSX.Element {
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-text">Policies</h1>
        <p className="text-sm text-text-muted">Last updated: June 23, 2026</p>
      </header>

      <div className="space-y-5 text-sm leading-7 text-text-muted">
        <h2 className="text-lg font-semibold text-text">Privacy Policy</h2>
        <p>
          We do not sell personal data. If analytics are enabled, they are used only to understand usage patterns
          and improve the product experience.
        </p>

        <h2 className="text-lg font-semibold text-text">Cookie Policy</h2>
        <p>
          This site may use local storage and essential browser storage for preferences, such as theme selection
          and saved prompt state. These settings are stored on your device.
        </p>

        <h2 className="text-lg font-semibold text-text">Content Policy</h2>
        <p>
          We aim to present licensed or attributable prompt datasets. If you believe content is incorrect,
          misattributed, or should be removed, contact us and we will review promptly.
        </p>

        <h2 className="text-lg font-semibold text-text">Takedown and Corrections</h2>
        <p>
          For takedown or correction requests, provide the exact URL and reason. Valid requests are processed as
          quickly as possible.
        </p>

        <h2 className="text-lg font-semibold text-text">Policy Updates</h2>
        <p>
          We may update these policies over time. Material changes will be reflected on this page with an updated
          effective date.
        </p>
      </div>
    </section>
  );
}

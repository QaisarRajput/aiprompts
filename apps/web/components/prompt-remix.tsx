"use client";

import { useMemo, useState } from "react";

import type { TemplateArgument } from "@aiprompts/schema";

import { PromptCopy } from "./prompt-copy";

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function PromptRemix({
  promptText,
  argumentsList
}: {
  promptText: string;
  argumentsList: TemplateArgument[];
}): JSX.Element {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(argumentsList.map((arg) => [arg.name, arg.default]))
  );

  const remixedText = useMemo(() => {
    let output = promptText;
    for (const arg of argumentsList) {
      const current = values[arg.name] ?? arg.default;
      const pattern = new RegExp(
        `\\{argument\\s+name="${escapeRegExp(arg.name)}"\\s+default="(?:[^"\\\\]|\\\\.)*"\\}`,
        "g"
      );
      output = output.replace(pattern, current);
    }
    return output;
  }, [promptText, argumentsList, values]);

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Remix</h2>
        <PromptCopy text={remixedText} />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {argumentsList.map((arg) => (
          <label key={arg.name} className="space-y-1 text-sm text-text-muted">
            <span className="block font-medium text-text">{arg.name}</span>
            <input
              value={values[arg.name] ?? ""}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  [arg.name]: event.target.value
                }))
              }
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text"
            />
          </label>
        ))}
      </div>
      <pre className="overflow-x-auto rounded-xl bg-surface-muted p-4 text-sm" style={{ fontFamily: "var(--font-geist-mono)" }}>
        <code>{remixedText}</code>
      </pre>
    </section>
  );
}

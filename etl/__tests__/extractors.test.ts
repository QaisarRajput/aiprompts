import { describe, expect, it } from "vitest";

import { splitTitle } from "../parse/categorize.js";
import { extractTemplateArguments } from "../parse/extract-arguments.js";
import { extractImagesFromHtmlNodes } from "../parse/extract-images.js";

describe("splitTitle", () => {
  it("splits category prefix when in taxonomy", () => {
    const out = splitTitle("Profile / Avatar - Cinematic Portrait", ["Profile / Avatar"]);
    expect(out).toEqual({ category: "Profile / Avatar", title: "Cinematic Portrait" });
  });

  it("keeps title when prefix is not taxonomy", () => {
    const out = splitTitle("Product Launch - Hyper Minimal", ["Profile / Avatar"]);
    expect(out).toEqual({ category: null, title: "Product Launch - Hyper Minimal" });
  });
});

describe("extractTemplateArguments", () => {
  it("extracts and dedupes Raycast arguments", () => {
    const prompt =
      '{argument name="subject" default="cat"} + {argument name="subject" default="cat"} + {argument name="style" default="noir"}';
    const args = extractTemplateArguments(prompt);

    expect(args).toHaveLength(2);
    expect(args[0]?.name).toBe("subject");
    expect(args[1]?.name).toBe("style");
  });
});

describe("extractImagesFromHtmlNodes", () => {
  it("parses HTML img nodes", () => {
    const images = extractImagesFromHtmlNodes([
      '<div><img src="https://cdn.example/a.jpg" width="700" alt="A"></div>'
    ]);

    expect(images).toHaveLength(1);
    expect(images[0]?.url).toBe("https://cdn.example/a.jpg");
    expect(images[0]?.width).toBe(700);
  });
});

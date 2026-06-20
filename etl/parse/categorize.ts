export function splitTitle(
  rawTitle: string,
  knownCategories: readonly string[]
): { category: string | null; title: string } {
  const separatorIndex = rawTitle.indexOf(" - ");
  if (separatorIndex === -1) {
    return { category: null, title: rawTitle.trim() };
  }

  const categoryCandidate = rawTitle.slice(0, separatorIndex).trim();
  const titlePart = rawTitle.slice(separatorIndex + 3).trim();

  // Accept if it's in the known taxonomy list
  if (knownCategories.length > 0 && knownCategories.includes(categoryCandidate)) {
    return { category: categoryCandidate, title: titlePart };
  }

  // Also accept any short prefix that looks like a category label
  // (≤ 60 chars, not a URL, not empty)
  if (
    categoryCandidate.length > 0 &&
    categoryCandidate.length <= 60 &&
    !categoryCandidate.startsWith("http") &&
    titlePart.length > 0
  ) {
    return { category: categoryCandidate, title: titlePart };
  }

  return { category: null, title: rawTitle.trim() };
}


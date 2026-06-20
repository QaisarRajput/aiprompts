export function splitTitle(
  rawTitle: string,
  knownCategories: readonly string[]
): { category: string | null; title: string } {
  const separatorIndex = rawTitle.indexOf(" - ");
  if (separatorIndex === -1) {
    return { category: null, title: rawTitle.trim() };
  }

  const categoryCandidate = rawTitle.slice(0, separatorIndex).trim();
  if (knownCategories.includes(categoryCandidate)) {
    return {
      category: categoryCandidate,
      title: rawTitle.slice(separatorIndex + 3).trim()
    };
  }

  return { category: null, title: rawTitle.trim() };
}

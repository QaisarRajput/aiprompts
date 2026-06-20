const script = `
(() => {
  const key = "aiprompts-theme";
  const root = document.documentElement;
  const saved = localStorage.getItem(key);
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const mode = saved === "light" || saved === "dark" ? saved : systemDark ? "dark" : "light";
  root.classList.toggle("dark", mode === "dark");
  root.dataset.theme = mode;
})();
`;

export function ThemeScript(): JSX.Element {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

// ponytail: naive cn — joins truthy classes, upgrade to tailwind-merge if conflicts matter
export function cn(...inputs) {
  return inputs
    .flat()
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

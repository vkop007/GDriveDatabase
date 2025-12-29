/**
 * Utility functions for GDriveDatabase
 */

/**
 * Format a date as a relative time string (e.g., "2 minutes ago", "3 days ago")
 * Shows full date on hover via title attribute
 */
export function formatRelativeTime(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 5) return "just now";
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${diffYears}y ago`;
}

/**
 * Get the full formatted date string for tooltip display
 */
export function formatFullDate(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return date.toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Compare function for sorting table data
 */
export function compareValues(
  a: unknown,
  b: unknown,
  type: string,
  direction: "asc" | "desc"
): number {
  const multiplier = direction === "asc" ? 1 : -1;

  // Handle null/undefined
  if (a == null && b == null) return 0;
  if (a == null) return 1 * multiplier;
  if (b == null) return -1 * multiplier;

  // Handle by type
  switch (type) {
    case "integer":
      return (Number(a) - Number(b)) * multiplier;

    case "boolean":
      return ((a ? 1 : 0) - (b ? 1 : 0)) * multiplier;

    case "datetime":
      const dateA = new Date(String(a)).getTime();
      const dateB = new Date(String(b)).getTime();
      return (dateA - dateB) * multiplier;

    case "string":
    default:
      return String(a).localeCompare(String(b)) * multiplier;
  }
}

/**
 * Filter documents by search query across all fields
 */
export function filterBySearch<T extends Record<string, unknown>>(
  documents: T[],
  searchQuery: string
): T[] {
  if (!searchQuery.trim()) return documents;

  const query = searchQuery.toLowerCase().trim();

  return documents.filter((doc) =>
    Object.values(doc).some((value) => {
      if (value == null) return false;
      if (Array.isArray(value)) {
        return value.some((item) => String(item).toLowerCase().includes(query));
      }
      return String(value).toLowerCase().includes(query);
    })
  );
}

/**
 * Highlight text that matches search query
 */
export function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return text;
  // This returns raw text - React component handles actual highlighting
  return text;
}

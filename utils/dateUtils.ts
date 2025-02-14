export function formatTaskDate(dateString: string | undefined): string {
  if (!dateString) return "";

  // Handle both ISO strings and YYYY-MM-DD formats
  const dateOnly = dateString.split("T")[0]; // Will either return YYYY-MM-DD or the original string if no 'T'
  const [year, month, day] = dateOnly.split("-");
  return `${month}/${day}/${year.slice(2)}`;
}

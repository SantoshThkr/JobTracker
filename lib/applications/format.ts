// Calendar dates (applied, follow-up) are stored at midnight UTC, so they are
// formatted in UTC to show the day the user picked. Status-change timestamps
// use the same formatting so server and client render identical text.
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDate(date: Date) {
  return dateFormatter.format(date);
}

/** Value for <input type="date">. */
export function toDateInputValue(date: Date | undefined) {
  return date ? date.toISOString().slice(0, 10) : "";
}

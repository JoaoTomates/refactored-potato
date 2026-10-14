export function nextRaceStart(from: Date): Date {
  const d = new Date(from);
  d.setHours(14, 0, 0, 0);
  const add = (7 - d.getDay()) % 7;
  d.setDate(d.getDate() + add);
  if (d <= from) d.setDate(d.getDate() + 7);
  return d;
}

/**
 * Returns true if the current date is within the week leading up to the next race.
 * This is used to highlight the market link in yellow during race week.
 */
export function isRaceWeek(date: Date = new Date()): boolean {
  const next = nextRaceStart(date);
  const diff = next.getTime() - date.getTime();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  return diff <= oneWeek && diff > 0;
}

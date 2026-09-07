import { addDays, startOfDay } from "date-fns";

export function nextBookableDays(count: number, from: Date = new Date()) {
  return Array.from({ length: count }, (_, i) => addDays(startOfDay(from), i));
}

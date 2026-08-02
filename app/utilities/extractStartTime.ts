import { TStartgroup } from "@/lib/db";
import { formatTime } from "./formatTime";

/**
 * Returns the planned start time of a start group as "HH:MM".
 */
export default function extractStartTime(group: TStartgroup): string[] {
  if (!group.starttime) {
    return [];
  }

  const startTime = formatTime(group.starttime);

  return startTime && !startTime.includes("NaN") ? [startTime] : [];
}

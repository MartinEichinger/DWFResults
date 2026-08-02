import { TStartgroup } from "@/lib/db";

/**
 * Returns the competition area of a start group. The area sensitive starting place
 * ("1", "2A", ...) is preferred, the numeric competition area is used as fallback.
 */
export function extractCompArea(group: TStartgroup): string[] {
  const startingPlace = group.areaSensitiveStartingPlace?.trim();

  if (startingPlace) {
    return [startingPlace];
  }

  if (group.competitionarea !== null && group.competitionarea !== undefined) {
    return [`${group.competitionarea}`];
  }

  return [];
}

export default extractCompArea;

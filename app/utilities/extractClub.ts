import { TStartgroup } from "@/lib/db";
import extractForms from "./extractForms";

/**
 * Returns all clubs taking part in a start group.
 */
export default function extractClub(group: TStartgroup): string[] {
  return extractForms(group)
    .flatMap((form) => [form.club, ...(form.participants ?? []).map((participant) => participant.club)])
    .map((club) => club?.trim() ?? "")
    .filter((club) => Boolean(club));
}

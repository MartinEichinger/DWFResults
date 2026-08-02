import { TForm, TStartgroup } from "@/lib/db";

/**
 * Returns all forms of a start group (a_startgroups -> a_categories -> a_forms).
 */
export default function extractForms(group: TStartgroup): TForm[] {
  return (group.categories ?? []).flatMap((category) => category.forms ?? []);
}

/**
 * Returns all category names of a start group.
 */
export function extractCategoryNames(group: TStartgroup): string[] {
  return (group.categories ?? []).map((category) => category.categoryname?.trim()).filter((categoryname): categoryname is string => Boolean(categoryname));
}

/**
 * Returns all participant names of a start group.
 */
export function extractParticipant(group: TStartgroup): string[] {
  return extractForms(group)
    .flatMap((form) => (form.participants ?? []).map((participant) => participant.name?.trim() ?? ""))
    .filter((name) => Boolean(name));
}

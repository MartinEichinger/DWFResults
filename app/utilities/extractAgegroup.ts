import { TStartgroup } from "@/lib/db";
import extractForms from "./extractForms";

/**
 * Returns all age groups of a start group. The age group is stored on the categories
 * and on the forms, both are taken into account.
 */
export default function extractAgegroup(group: TStartgroup): string[] {
  const categoryAgegroups = (group.categories ?? []).map((category) => category.agegroup);
  const formAgegroups = extractForms(group).map((form) => form.agegroup);

  return [...categoryAgegroups, ...formAgegroups].map((agegroup) => agegroup?.trim() ?? "").filter((agegroup) => Boolean(agegroup));
}

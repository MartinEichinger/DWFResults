import { TStartgroup } from "@/lib/db";
import extractForms from "./extractForms";

const genderLabels: Record<string, string> = {
  m: "Männlich",
  male: "Männlich",
  maennlich: "Männlich",
  männlich: "Männlich",
  w: "Weiblich",
  f: "Weiblich",
  female: "Weiblich",
  weiblich: "Weiblich",
  mixed: "Gemischt",
  gemischt: "Gemischt",
};

/**
 * Maps the gender codes of the database to readable labels. Unknown values are kept as they are.
 */
export function toGenderLabel(gender: string): string {
  return genderLabels[gender.trim().toLowerCase()] ?? gender.trim();
}

/**
 * Returns all genders of a start group. The gender is stored on the categories and on
 * the forms, both are taken into account.
 */
export default function extractGender(group: TStartgroup): string[] {
  const categoryGenders = (group.categories ?? []).map((category) => category.gender);
  const formGenders = extractForms(group).map((form) => form.gender);

  return [...categoryGenders, ...formGenders].map((gender) => (gender ? toGenderLabel(gender) : "")).filter((gender) => Boolean(gender));
}

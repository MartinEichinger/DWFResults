import Link from "next/link";
import { getNavigationEntries } from "@/lib/results";

export default async function Home() {
  const entries = await getNavigationEntries();

  if (entries.length > 0) {
    const first = entries[0];
    return (
      <section>
        <h2>Veranstaltungen</h2>
        <p>
          Wähle in der Navigation eine Veranstaltung oder öffne direkt die neueste:
          {" "}
          <Link href={`/${first.eventSlug}/${first.year}`}>
            {first.eventName} {first.year}
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2>Keine Ergebnisse vorhanden</h2>
      <p>
        Ergebnisse können extern über <code>POST /api/results</code> in die Datenbank
        geschrieben werden.
      </p>
    </section>
  );
}

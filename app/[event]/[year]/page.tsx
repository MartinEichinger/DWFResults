import { notFound } from "next/navigation";
import { getResultGroups } from "@/lib/results";

type Props = {
  params: Promise<{ event: string; year: string }>;
};

export default async function EventYearPage({ params }: Props) {
  const { event, year } = await params;
  const parsedYear = Number(year);

  if (!Number.isInteger(parsedYear)) {
    notFound();
  }

  const { eventName, groups } = await getResultGroups(event, parsedYear);

  if (!eventName) {
    notFound();
  }

  return (
    <section>
      <header className="result-header">
        <h2>{eventName}</h2>
        <p>{parsedYear}</p>
      </header>

      {groups.map((group) => (
        <article key={group.groupName} className="group-card">
          <h3>{group.groupName}</h3>
          <table>
            <thead>
              <tr>
                <th>Platz</th>
                <th>Name</th>
                <th>Verein</th>
                <th>Punkte</th>
              </tr>
            </thead>
            <tbody>
              {group.rows.map((row, index) => (
                <tr key={`${group.groupName}-${index}`}>
                  <td>{row.rank}</td>
                  <td>{row.athleteName}</td>
                  <td>{row.clubName || "-"}</td>
                  <td>{row.score === null ? "-" : row.score.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      ))}
    </section>
  );
}

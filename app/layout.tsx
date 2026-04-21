import type { Metadata } from "next";
import Link from "next/link";
import { getNavigationEntries } from "@/lib/results";
import "./globals.css";

export const metadata: Metadata = {
  title: "DWF Results",
  description: "Wushu Wettbewerbsergebnisse",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const entries = await getNavigationEntries();

  return (
    <html lang="de">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <h1>DWF Results</h1>
            <nav>
              {entries.length === 0 ? (
                <p className="empty-nav">Noch keine Veranstaltungen vorhanden.</p>
              ) : (
                <ul>
                  {entries.map((entry) => {
                    const href = `/${entry.eventSlug}/${entry.year}`;
                    return (
                      <li key={href}>
                        <Link href={href}>{entry.eventName + " " + entry.year}</Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </nav>
          </aside>
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDate } from "./utilities/formatDate";

interface Event {
	id: number;
	name: string;
	year: number;
	slug: string;
	date?: string;
	location?: string;
}

export default function Home() {
	const [events, setEvents] = useState<Event[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchEvents = async () => {
			try {
				const response = await fetch("/api/events");
				const data = await response.json();
				setEvents(data.events || []);
			} catch (error) {
				console.error("Error fetching events:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchEvents();
	}, []);

	// Extract year from slug (format: YYYY-slug)
	const getEventUrl = (event: Event) => {
		const slugParts = event.slug.split("-");
		const year = slugParts[0];
		const slug = slugParts.slice(1).join("-");
		return `/events/${year}/${slug}`;
	};

	return (
		<div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
			<main className="max-w-4xl mx-auto">
				<h1 className="text-4xl font-bold mb-8">
					DWF Wushu Competition Results
				</h1>

				<div className="mb-8">
					<h2 className="text-2xl font-semibold mb-4">
						Veranstaltungen
					</h2>

					{loading ? (
						<p className="text-gray-600 dark:text-gray-400">
							Lädt...
						</p>
					) : events.length === 0 ? (
						<div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
							<p className="text-gray-600 dark:text-gray-400 mb-4">
								Noch keine
								Veranstaltungen
								vorhanden.
							</p>
							<p className="text-sm text-gray-500 dark:text-gray-500">
								Nutze die API
								(/api/import) um
								Daten zu
								importieren.
							</p>
						</div>
					) : (
						<nav className="space-y-2">
							{events.map((event) => (
								<Link
									key={
										event.id
									}
									href={getEventUrl(
										event,
									)}
									className="block p-4 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors shadow-sm"
								>
									<div className="flex justify-between items-start">
										<div>
											<h3 className="font-semibold text-lg">
												{
													event.name
												}
											</h3>
											{event.date && (
												<p className="text-sm text-gray-600 dark:text-gray-400">
													Datum:{" "}
													{formatDate(
														event.date,
													)}
												</p>
											)}
											{event.location && (
												<p className="text-sm text-gray-600 dark:text-gray-400">
													Ort:{" "}
													{
														event.location
													}
												</p>
											)}
										</div>
										<span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
											{
												event.year
											}
										</span>
									</div>
								</Link>
							))}
						</nav>
					)}
				</div>
			</main>
		</div>
	);
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Result {
	id: number;
	rank?: number;
	score?: number;
	difficulty?: number;
	execution?: number;
	athlete_name: string;
	athlete_club?: string;
	judge_scores?: string;
}

interface Group {
	id: number;
	name: string;
	category?: string;
	age_group?: string;
	results: Result[];
}

interface Event {
	id: number;
	name: string;
	year: number;
	date?: string;
	location?: string;
}

const debug = 1;

export default function EventResultsPage() {
	const params = useParams();
	const [event, setEvent] = useState<Event | null>(null);
	const [groups, setGroups] = useState<Group[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchResults = async () => {
			try {
				const slug = `${params.year}-${params.slug}`;
				const response = await fetch(
					`/api/events/${slug}`,
				);

				if (!response.ok) {
					throw new Error(
						"Failed to fetch results",
					);
				}

				const data = await response.json();
				setEvent(data.event);
				setGroups(data.groups);
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "An error occurred",
				);
			} finally {
				setLoading(false);
			}
		};

		fetchResults();
	}, [params.year, params.slug]);

	if (loading) {
		return (
			<div className="min-h-screen p-8">
				<div className="max-w-7xl mx-auto">
					<p>Lädt...</p>
				</div>
			</div>
		);
	}

	if (error || !event) {
		return (
			<div className="min-h-screen p-8">
				<div className="max-w-7xl mx-auto">
					<p className="text-red-600">
						Fehler:{" "}
						{error ||
							"Veranstaltung nicht gefunden"}
					</p>
					<Link
						href="/"
						className="text-blue-600 hover:underline mt-4 inline-block"
					>
						Zurück zur Startseite
					</Link>
				</div>
			</div>
		);
	}

	if (debug > 0) console.log("EventResultsPage: ", groups);
	return (
		<div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<Link
						href="/"
						className="text-blue-600 hover:underline mb-4 inline-block"
					>
						← Zurück zur Startseite
					</Link>
					<h1 className="text-4xl font-bold mb-2">
						{event.name}
					</h1>
					{event.date && (
						<p className="text-gray-600 dark:text-gray-400">
							Datum: {event.date}
						</p>
					)}
					{event.location && (
						<p className="text-gray-600 dark:text-gray-400">
							Ort: {event.location}
						</p>
					)}
				</div>

				{/* Groups */}
				{groups.length === 0 ? (
					<p className="text-gray-600 dark:text-gray-400">
						Noch keine Ergebnisse verfügbar.
					</p>
				) : (
					<div className="space-y-8">
						{groups.map((group) => (
							<div
								key={group.id}
								className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
							>
								{/* Group Header */}
								<div className="bg-blue-600 text-white p-4">
									<h2 className="text-2xl font-bold">
										{
											group.name
										}
									</h2>
									{group.category && (
										<p className="text-blue-100">
											Kategorie:{" "}
											{
												group.category
											}
										</p>
									)}
									{group.age_group && (
										<p className="text-blue-100">
											Altersklasse:{" "}
											{
												group.age_group
											}
										</p>
									)}
								</div>

								{/* Results Table */}
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead className="bg-gray-100 dark:bg-gray-700">
											<tr>
												<th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
													Platz
												</th>
												<th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
													Name
												</th>
												<th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
													Verein
												</th>
												<th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
													Endwertung
												</th>
											</tr>
										</thead>
										<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
											{group.results.map(
												(
													result,
												) => (
													<tr
														key={
															result.id
														}
														className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
													>
														<td className="px-4 py-4 whitespace-nowrap">
															<span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
																{result.rank ||
																	"-"}
															</span>
														</td>
														<td className="px-4 py-4 whitespace-nowrap">
															<div className="text-sm font-medium text-gray-900 dark:text-gray-100">
																{
																	result.athlete_name
																}
															</div>
														</td>
														<td className="px-4 py-4 whitespace-nowrap">
															<div className="text-sm text-gray-600 dark:text-gray-400">
																{result.athlete_club ||
																	"-"}
															</div>
														</td>
														<td className="px-4 py-4 whitespace-nowrap text-right">
															<div className="text-lg font-bold text-gray-900 dark:text-gray-100">
																{result.score?.toFixed(
																	2,
																) ||
																	"-"}
															</div>
														</td>
													</tr>
												),
											)}
										</tbody>
									</table>
								</div>

								{group.results
									.length ===
									0 && (
									<div className="p-8 text-center text-gray-600 dark:text-gray-400">
										Noch
										keine
										Ergebnisse
										vorhanden
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

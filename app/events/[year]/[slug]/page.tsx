"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/app/utilities/formatDate";

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

const debug = 0;

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
			<div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
				<div className="mx-auto max-w-7xl rounded-2xl bg-white p-6 shadow-sm sm:p-8">
					<p>Lädt...</p>
				</div>
			</div>
		);
	}

	if (error || !event) {
		return (
			<div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
				<div className="mx-auto max-w-7xl rounded-2xl bg-white p-6 shadow-sm sm:p-8">
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
		<div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
			<div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-white shadow-sm">
				<div className="bg-blue-600 px-6 py-5 text-white sm:px-8">
					<Link
						href="/"
						className="mb-4 inline-block text-sm font-medium text-blue-100 transition-colors hover:text-white hover:underline"
					>
						← Zurück zur Startseite
					</Link>
					<h1 className="text-3xl font-bold leading-tight sm:text-4xl">
						{event.name}
					</h1>
					<div className="mt-2 space-y-1 text-sm text-blue-100 sm:text-base">
						{event.date && (
							<p>
								Datum:{" "}
								{formatDate(event.date)}
							</p>
						)}
						{event.location && (
							<p>Ort: {event.location}</p>
						)}
					</div>
				</div>

				{/* Groups */}
				<div className="p-4 sm:p-6 lg:p-8">
					{groups.length === 0 ? (
						<p className="text-gray-600">
							Noch keine Ergebnisse verfügbar.
						</p>
					) : (
						<div className="flex flex-wrap gap-6">
							{groups.map((group) => (
								<div
									key={group.id}
									className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:w-[calc(50%-0.75rem)]"
								>
								{/* Group Header */}
								<div className="bg-blue-600 p-4 text-white">
									<h2 className="text-xl font-bold">
										{
											group.name
										}
									</h2>
									{group.category && (
										<p className="text-sm text-blue-100">
											Kategorie:{" "}
											{
												group.category
											}
										</p>
									)}
									{group.age_group && (
										<p className="text-sm text-blue-100">
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
										<thead className="bg-gray-100">
											<tr>
												<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
													Platz
												</th>
												<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
													Name
												</th>
												<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
													Verein
												</th>
												<th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700">
													Endwertung
												</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-gray-200 bg-white">
											{group.results.map(
												(
													result,
												) => (
													<tr
														key={
															result.id
														}
														className="transition-colors hover:bg-gray-50"
													>
														<td className="px-4 py-4 whitespace-nowrap">
															<span className="text-lg font-semibold text-gray-900">
																{result.rank ||
																	"-"}
															</span>
														</td>
														<td className="px-4 py-4 whitespace-nowrap">
															<div className="text-sm font-medium text-gray-900">
																{
																	result.athlete_name
																}
															</div>
														</td>
														<td className="px-4 py-4 whitespace-nowrap">
															<div className="text-sm text-gray-600">
																{result.athlete_club ||
																	"-"}
															</div>
														</td>
														<td className="px-4 py-4 whitespace-nowrap text-right">
															<div className="text-lg font-bold text-gray-900">
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
									<div className="p-8 text-center text-gray-600">
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
		</div>
	);
}

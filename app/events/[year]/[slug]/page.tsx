"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/app/utilities/formatDate";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ResultCard from "@/app/components/card";

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
				const response = await fetch(`/api/events/${slug}`);

				if (!response.ok) {
					throw new Error("Failed to fetch results");
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
			<Box
				sx={{
					minHeight: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

	if (error || !event) {
		return (
			<Box
				sx={{
					minHeight: "100vh",
					padding: { xs: "16px", lg: "56px" },
				}}
			>
				<Container maxWidth="lg">
					<Typography color="error" sx={{ marginBottom: "16px" }}>
						Fehler: {error || "Veranstaltung nicht gefunden"}
					</Typography>
					<Link href="/" style={{ textDecoration: "none" }}>
						<Button
							variant="contained"
							startIcon={<ArrowBackIcon />}
						>
							Zurück zur Startseite
						</Button>
					</Link>
				</Container>
			</Box>
		);
	}

	if (debug > 0) console.log("EventResultsPage: ", groups);

	return (
		<Box
			sx={{
				minHeight: "100vh",
				padding: { xs: "16px", lg: "56px" },
				backgroundColor: "background.default",
			}}
		>
			<Container maxWidth="xl">
				{/* Header */}
				<Box sx={{ marginBottom: "32px" }}>
					<Link href="/" style={{ textDecoration: "none" }}>
						<Button
							variant="text"
							startIcon={<ArrowBackIcon />}
							sx={{ marginBottom: "16px" }}
						>
							Zurück zur Startseite
						</Button>
					</Link>
					<Typography
						variant="h3"
						sx={{
							fontWeight: "bold",
							marginBottom: "8px",
							color: "primary.main",
						}}
					>
						{event.name}
					</Typography>
					{event.date && (
						<Typography variant="body1" color="text.secondary">
							Datum: {formatDate(event.date)}
						</Typography>
					)}
					{event.location && (
						<Typography variant="body1" color="text.secondary">
							Ort: {event.location}
						</Typography>
					)}
				</Box>

				{/* Groups */}
				{groups.length === 0 ? (
					<Typography variant="body1" color="text.secondary">
						Noch keine Ergebnisse verfügbar.
					</Typography>
				) : (
					<Box
						sx={{
							display: "flex",
							flexDirection: "row",
							flexWrap: "wrap",
							gap: { xs: "8px", sm: "16px" },
						}}
					>
						{groups.map((group, index) => (
							<Box
								key={group.id}
								sx={{
									display: "flex",
									flexDirection: "row",
									margin: { sm: "16px", xs: "8px 0px" },
									flex: "1 1 0px",
									minWidth: { xs: "100%", md: "calc(50% - 16px)" },
								}}
							>
								<ResultCard
									index={index}
									title={group.name}
									category={group.category}
									ageGroup={group.age_group}
									entries={group.results}
								/>
							</Box>
						))}
					</Box>
				)}
			</Container>
		</Box>
	);
}

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
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

export interface Result {
  id: number;
  group_id: number;
  athlete_id: number;
  athlete_name: string;
  athlete_club: string;
  rank: number | null;
  score: number | null;
  rating1: number | null;
  rating2: number | null;
  rating3: number | null;
  rating4: number | null;
  rating5: number | null;
  rating6: number | null;
  rating7: number | null;
  rating8: number | null;
  standarddeviation: number | null;
  mainrefereededuction: number | null;
  mainrefereedeductionjustification: string | null;
  notshowedup: number;
}

interface Group {
  id: number;
  actually_completed: string;
  created_at: string;
  event_id: number;
  start_group_id: number;
  start_group_title: string;
  start_time: string;
  area_sensitive_starting_place: string;
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

  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down("md"));
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

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
        setError(err instanceof Error ? err.message : "An error occurred");
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
          <Link
            href="/"
            style={{
              textDecoration: "none",
            }}
          >
            <Button variant="contained" startIcon={<ArrowBackIcon />}>
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
        padding: { xs: "16px 16px", lg: "56px 56px" },
        backgroundColor: "background.default",
      }}
    >
      <Container maxWidth="xl" sx={{ padding: { xs: "0px", lg: "0px 16px" } }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            position: "sticky",
            paddingTop: { xs: "0px", md: "16px" },
            top: "0px",
            zIndex: "1",
            bgcolor: "background.default",
          }}
        >
          <Link
            href="/"
            style={{
              textDecoration: "none",
            }}
          >
            <Button
              variant="text"
              startIcon={<ArrowBackIcon />}
              sx={{
                marginBottom: "16px",
              }}
            >
              Zurück zur Startseite
            </Button>
          </Link>
          <Typography
            variant={isSm ? "h4" : "h3"}
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
              flexWrap: "wrap",
              flex: 1,
              overflowY: "auto",
              paddingY: "0px",
            }}
          >
            {groups.map((group, index) => (
              <Box
                key={group.id}
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  margin: {
                    sm: "16px",
                    xs: "8px 0px",
                  },
                  flex: "1 1 0px",
                  minWidth: {
                    xs: "100%",
                    md: "calc(50% - 32px)",
                  },
                }}
              >
                <ResultCard
                  index={index}
                  title={group.start_group_title}
                  startingPlace={group.area_sensitive_starting_place}
                  startTime={group.start_time}
                  completionTime={group.actually_completed}
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

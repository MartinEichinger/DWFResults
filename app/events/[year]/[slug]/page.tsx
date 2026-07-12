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
import { Event, Group, Result as DbResult } from "@/lib/db";
import SelectButton from "@/app/components/selectbutton";
import FilterChip from "@/app/components/filterchip";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

export interface Result extends DbResult {
  athlete_name: string;
  athlete_club: string | null;
  reasonForDecision?: "SD" | "HS" | string;
}

interface ImportedGroup extends Group {
  results: Result[];
}

const debug = 1;

export default function EventResultsPage() {
  const params = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [groups, setGroups] = useState<ImportedGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(true);

  // Filter state
  const [athleteFilter, setAthleteFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");

  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down("md"));
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const getStandardDeviation = (result: Result) => result.standarddeviation ?? Number.POSITIVE_INFINITY;
    const getMainJudgeRating = (result: Result) => result.rating1 ?? Number.NEGATIVE_INFINITY;
    const getMainRefereeDeduction = (result: Result) =>
      result.mainrefereededuction !== null && result.mainrefereededuction > 0 ? `${result.mainrefereededuction}` : null;
    const numbersAreEqual = (left: number, right: number) => {
      if (!Number.isFinite(left) || !Number.isFinite(right)) {
        return left === right;
      }

      return Math.abs(left - right) < Number.EPSILON;
    };

    const annotateDecisionReasons = (groupResults: Result[]): Result[] => {
      const annotatedResults = groupResults.map((result) => ({
        ...result,
        reasonForDecision: getMainRefereeDeduction(result) ?? undefined,
      }));

      const resultsByScore = new Map<number, Result[]>();

      annotatedResults.forEach((result) => {
        if (result.score === null) {
          return;
        }

        const tiedResults = resultsByScore.get(result.score) ?? [];
        tiedResults.push(result);
        resultsByScore.set(result.score, tiedResults);
      });

      resultsByScore.forEach((tiedResults) => {
        if (tiedResults.length < 2) {
          return;
        }

        const sortedResults = [...tiedResults].sort((left, right) => {
          const leftStandardDeviation = getStandardDeviation(left);
          const rightStandardDeviation = getStandardDeviation(right);

          if (!numbersAreEqual(leftStandardDeviation, rightStandardDeviation)) {
            return leftStandardDeviation - rightStandardDeviation;
          }

          const leftMainJudgeRating = getMainJudgeRating(left);
          const rightMainJudgeRating = getMainJudgeRating(right);

          if (!numbersAreEqual(leftMainJudgeRating, rightMainJudgeRating)) {
            return rightMainJudgeRating - leftMainJudgeRating;
          }

          return left.id - right.id;
        });

        const decisionGroups = sortedResults.reduce<Result[][]>((groups, result) => {
          const currentGroup = groups[groups.length - 1];

          if (!currentGroup) {
            groups.push([result]);
            return groups;
          }

          const groupReference = currentGroup[0];
          const hasSameStandardDeviation = numbersAreEqual(getStandardDeviation(result), getStandardDeviation(groupReference));
          const hasSameMainJudgeRating = numbersAreEqual(getMainJudgeRating(result), getMainJudgeRating(groupReference));

          if (hasSameStandardDeviation && hasSameMainJudgeRating) {
            currentGroup.push(result);
          } else {
            groups.push([result]);
          }

          return groups;
        }, []);

        decisionGroups.forEach((decisionGroup, index) => {
          const nextGroup = decisionGroups[index + 1];

          if (!nextGroup) {
            return;
          }

          const currentStandardDeviation = getStandardDeviation(decisionGroup[0]);
          const nextStandardDeviation = getStandardDeviation(nextGroup[0]);

          if (!numbersAreEqual(currentStandardDeviation, nextStandardDeviation) && Number.isFinite(currentStandardDeviation)) {
            decisionGroup.forEach((result) => {
              if (result.reasonForDecision === undefined) {
                result.reasonForDecision = "SD";
              }
            });
            return;
          }

          const currentMainJudgeRating = getMainJudgeRating(decisionGroup[0]);
          const nextMainJudgeRating = getMainJudgeRating(nextGroup[0]);

          if (!numbersAreEqual(currentMainJudgeRating, nextMainJudgeRating) && currentMainJudgeRating > nextMainJudgeRating) {
            decisionGroup.forEach((result) => {
              if (result.reasonForDecision === undefined) {
                result.reasonForDecision = "HS";
              }
            });
          }
        });
      });

      return annotatedResults;
    };

    const fetchResults = async () => {
      try {
        const slug = `${params.year}-${params.slug}`;
        const response = await fetch(`/api/events/${slug}`);

        if (!response.ok) {
          throw new Error("Failed to fetch results");
        }

        const data = await response.json();
        setEvent(data.event);
        setGroups(
          data.groups
            .map((group: ImportedGroup) => ({
              ...group,
              results: annotateDecisionReasons(group.results),
            }))
            .sort((a: ImportedGroup, b: ImportedGroup) =>
              a.area_sensitive_starting_place.localeCompare(b.area_sensitive_starting_place, undefined, { numeric: true, sensitivity: "base" }),
            ),
        );
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

  // Build athlete list from all groups
  const allAthleteNames = Array.from(new Set(groups.flatMap((group) => group.results.map((r) => r.athlete_name)))).sort();
  const athletedata = { label: "Athlet", values: ["", ...allAthleteNames] };

  // Build group list from all groups
  const allGroupNames = Array.from(new Set(groups.map((group) => group.start_group_title))).sort();
  const groupdata = { label: "Startgruppe", values: ["", ...allGroupNames] };

  // Apply filters
  let filteredGroups = groups;
  if (athleteFilter !== "") {
    filteredGroups = filteredGroups.filter((group) => group.results.some((r) => r.athlete_name === athleteFilter));
  }
  if (groupFilter !== "") {
    filteredGroups = filteredGroups.filter((group) => group.start_group_title === groupFilter);
  }

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
            zIndex: "10",
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
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              marginBottom: "8px",
            }}
          >
            <Box>
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
            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", marginTop: { xs: "8px", sm: "0px" } }}>
              <SelectButton setFilter={setAthleteFilter} listdata={athletedata} />
              <SelectButton setFilter={setGroupFilter} listdata={groupdata} />
            </Box>
          </Box>
          {(athleteFilter !== "" || groupFilter !== "") && (
            <Box sx={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
              {athleteFilter !== "" && <FilterChip listdata={athletedata} filter={athleteFilter} setFilter={setAthleteFilter} />}
              {groupFilter !== "" && <FilterChip listdata={groupdata} filter={groupFilter} setFilter={setGroupFilter} />}
            </Box>
          )}
          <Collapse in={infoOpen}>
            <Alert
              severity="info"
              icon={<InfoOutlinedIcon />}
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setInfoOpen(false);
                  }}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
              sx={{ marginTop: "16px", marginBottom: "8px" }}
            >
              <AlertTitle>Erklärung der Ergebnisliste</AlertTitle>
              <Typography variant="body2" sx={{ marginBottom: "8px" }}>
                Die Ergebnisse werden nach Rang sortiert angezeigt. Bei Punktgleichheit werden folgende Badges zur Erklärung der
                Rangfolge verwendet:
              </Typography>
              <Typography variant="body2" component="div">
                <strong>SD</strong> (Standard Deviation): Die Standardabweichung wurde zur Ermittlung des Rangs herangezogen. Eine
                niedrigere Standardabweichung wird bevorzugt.
              </Typography>
              <Typography variant="body2" component="div">
                <strong>HS</strong> (Hauptschiedsrichter): Die Wertung des Hauptschiedsrichters wurde zur Ermittlung des Rangs
                herangezogen. Eine höhere Wertung wird bevorzugt.
              </Typography>
              <Typography variant="body2" component="div">
                <strong>Zahl</strong> (z.B. 0.3): Der Hauptschiedsrichter-Abzug wurde angewendet. Die angezeigte Zahl ist der
                Abzugswert.
              </Typography>
            </Alert>
          </Collapse>
        </Box>

        {/* Groups */}
        {groups.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            Noch keine Ergebnisse verfügbar.
          </Typography>
        ) : filteredGroups.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ marginTop: "16px" }}>
            Keine Ergebnisse entsprechen den ausgewählten Filtern.
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
            {filteredGroups.map((group, index) => (
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

"use client";

import { useEffect, useMemo } from "react";
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
import { TStartgroup, TForm } from "@/lib/db";
import { selectEventResults } from "@/lib/store";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchEventResults } from "@/lib/store/eventResultsSlice";
import { useEventResultsLiveUpdates } from "@/app/hooks/useEventResultsLiveUpdates";

export interface Result extends TForm {
  reasonForDecision?: "SD" | "HS" | string;
}

interface ImportedGroup extends TStartgroup {
  results: Result[];
}

const debug = 1;

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
    if (result.finalscore === null || result.finalscore === undefined) {
      return;
    }

    const tiedResults = resultsByScore.get(result.finalscore) ?? [];
    tiedResults.push(result);
    resultsByScore.set(result.finalscore, tiedResults);
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

const flattenForms = (group: TStartgroup): Result[] =>
  (group.categories ?? [])
    .flatMap((category) => category.forms ?? [])
    .sort((left, right) => {
      const leftPlacement = left.placement ?? Number.POSITIVE_INFINITY;
      const rightPlacement = right.placement ?? Number.POSITIVE_INFINITY;

      if (leftPlacement !== rightPlacement) {
        return leftPlacement - rightPlacement;
      }

      return (left.startingorder ?? Number.POSITIVE_INFINITY) - (right.startingorder ?? Number.POSITIVE_INFINITY);
    });

const buildGroups = (groups: TStartgroup[]): ImportedGroup[] =>
  groups
    .map((group) => ({
      ...group,
      results: annotateDecisionReasons(flattenForms(group)),
    }))
    .sort((a, b) =>
      (a.areaSensitiveStartingPlace ?? "").localeCompare(b.areaSensitiveStartingPlace ?? "", undefined, { numeric: true, sensitivity: "base" }),
    );

export default function EventResultsPage() {
  const params = useParams();
  const dispatch = useAppDispatch();
  const slug = `${params.year}-${params.slug}`;

  // All displayed data comes from the redux store, which mirrors the database.
  const eventResults = useAppSelector((state) => selectEventResults(state, slug));
  const event = eventResults?.event ?? null;
  const status = eventResults?.status ?? "idle";
  const error = eventResults?.error ?? null;
  const loading = status === "idle" || (status === "loading" && event === null);

  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down("md"));
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    if (params.year === undefined || params.slug === undefined) {
      return;
    }

    dispatch(fetchEventResults(slug));
  }, [dispatch, slug, params.year, params.slug]);

  // Keeps the store in sync with every database update done through the API routes.
  useEventResultsLiveUpdates(slug);

  const groups = useMemo(() => buildGroups(eventResults?.groups ?? []), [eventResults?.groups]);

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
                  title={group.startgroupname}
                  startingPlace={group.areaSensitiveStartingPlace}
                  startTime={group.starttime}
                  completionTime={group.actuallycompleted}
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

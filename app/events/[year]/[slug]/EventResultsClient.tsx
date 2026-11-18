"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { formatDate } from "@/app/utilities/formatDate";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ResultCard from "@/app/components/card";
import FilterChip from "@/app/components/filterchip";
import FilterHeadline from "@/app/components/filterheadline";
import SelectButton from "@/app/components/selectbutton";
import Collapse from "@mui/material/Collapse";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import RefreshIcon from "@mui/icons-material/Refresh";
import Alert from "@mui/material/Alert";
import { TEvent, TStartgroup, TForm } from "@/lib/db";
import { selectEventResults } from "@/lib/store";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchEventResults, setEventResults } from "@/lib/store/eventResultsSlice";
import { useEventResultsLiveUpdates } from "@/app/hooks/useEventResultsLiveUpdates";
import useFilterState, { FilterDefinition } from "@/app/utilities/useFilterState";

export interface Result extends TForm {
  reasonForDecision?: "SD" | "HS" | string;
}

interface ImportedGroup extends TStartgroup {
  results: Result[];
}

const debug = 1;

const getStandardDeviation = (result: Result) => result.standarddeviation ?? Number.POSITIVE_INFINITY;
const getMainJudgeRating = (result: Result) => result.rating1 ?? Number.NEGATIVE_INFINITY;
const getMainRefereeDeduction = (result: Result) => {
  return result.mainrefereededuction !== null && (result.mainrefereededuction > 0 || result.mainrefereededuction < 0) ? `${result.mainrefereededuction}` : null;
};
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

const isFilledString = (value: string | null | undefined): value is string => typeof value === "string" && value.length > 0;

const isNumber = (value: number | null | undefined): value is number => typeof value === "number";

const buildGroups = (groups: TStartgroup[]): ImportedGroup[] =>
  groups
    .map((group) => ({
      ...group,
      results: annotateDecisionReasons(flattenForms(group)),
    }))
    .sort((a, b) => (a.areaSensitiveStartingPlace ?? "").localeCompare(b.areaSensitiveStartingPlace ?? "", undefined, { numeric: true, sensitivity: "base" }));

export type EventResultsClientProps = {
  slug: string;
  initialEvent: TEvent | null;
  initialGroups: TStartgroup[];
  initialVersion: string | null;
};

export default function EventResultsClient({ slug, initialEvent, initialGroups, initialVersion }: EventResultsClientProps) {
  const dispatch = useAppDispatch();

  // The initial payload is rendered on the server, the redux store only keeps it
  // up to date afterwards.
  const eventResults = useAppSelector((state) => selectEventResults(state, slug));
  const status = eventResults?.status ?? "idle";
  const event = status === "idle" ? initialEvent : (eventResults?.event ?? null);
  const rawGroups = useMemo(() => (status === "idle" ? initialGroups : (eventResults?.groups ?? [])), [status, initialGroups, eventResults?.groups]);
  const error = eventResults?.error ?? null;
  const loading = status === "loading" && event === null;

  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down("md"));
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  // The server rendered payload is only used to seed the store once. Afterwards
  // polling owns the data - re-seeding would overwrite newer results with the
  // (possibly cached) payload of the initial render.
  const seededSlugRef = useRef<string | null>(null);

  useEffect(() => {
    if (seededSlugRef.current === slug) {
      return;
    }

    seededSlugRef.current = slug;

    if (initialEvent) {
      dispatch(setEventResults({ slug, event: initialEvent, groups: initialGroups }));
      return;
    }

    dispatch(fetchEventResults(slug));
  }, [dispatch, slug, initialEvent, initialGroups]);

  // Keeps the store in sync by polling the cheap version endpoint.
  const { paused, refresh } = useEventResultsLiveUpdates(slug, initialVersion);

  const groups = useMemo(() => buildGroups(rawGroups), [rawGroups]);

  // Define the available filters and how each one derives its options and matching value.
  const filterDefinitions = useMemo<FilterDefinition<TStartgroup>[]>(() => {
    return [
      {
        key: "club",
        label: "Verein",
        getOptions: (groups) => {
          const safeGroups = Array.isArray(groups) ? groups : [];
          const clubs = Array.from(
            new Set(
              safeGroups
                .flatMap((group) =>
                  (Array.isArray(group.categories) ? group.categories : []).flatMap((category) =>
                    (Array.isArray(category.forms) ? category.forms : []).flatMap((form) => (form.participants ?? []).map((participant) => participant.club)),
                  ),
                )
                .filter(isFilledString),
            ),
          );

          return ["", ...clubs.sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()))];
        },
        getValue: (group) => {
          const safeCategories = Array.isArray(group.categories) ? group.categories : [];
          const clubs = Array.from(
            new Set(
              safeCategories
                .flatMap((category) =>
                  (Array.isArray(category.forms) ? category.forms : []).flatMap((form) => (form.participants ?? []).map((participant) => participant.club)),
                )
                .filter(isFilledString),
            ),
          );

          return clubs;
        },
      },
      {
        key: "name",
        label: "Name",
        getOptions: (groups) => {
          const safeGroups = Array.isArray(groups) ? groups : [];
          const names = Array.from(
            new Set(
              safeGroups
                .flatMap((group) =>
                  (Array.isArray(group.categories) ? group.categories : []).flatMap((category) =>
                    (Array.isArray(category.forms) ? category.forms : []).flatMap((form) =>
                      (form.participants ?? []).map((participant) => `${participant.forename ?? ""} ${participant.surname ?? ""}`.trim() || form.name),
                    ),
                  ),
                )
                .filter(isFilledString),
            ),
          );

          return ["", ...names.sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()))];
        },
        getValue: (group) => {
          const safeCategories = Array.isArray(group.categories) ? group.categories : [];
          const names = Array.from(
            new Set(
              safeCategories
                .flatMap((category) =>
                  (Array.isArray(category.forms) ? category.forms : []).flatMap((form) =>
                    (form.participants ?? []).map((participant) => `${participant.forename ?? ""} ${participant.surname ?? ""}`.trim() || form.name),
                  ),
                )
                .filter(isFilledString),
            ),
          );

          return names;
        },
      },
      {
        key: "agegroup",
        label: "Altersgruppe",
        getOptions: (groups) => {
          const safeGroups = Array.isArray(groups) ? groups : [];
          const values = Array.from(
            new Set(
              safeGroups
                .flatMap((group) => (Array.isArray(group.categories) ? group.categories : []).map((category) => category.agegroup))
                .filter(isFilledString),
            ),
          );
          return ["", ...values];
        },
        getValue: (group) => {
          const values = Array.from(
            new Set((Array.isArray(group.categories) ? group.categories : []).map((category) => category.agegroup).filter(isFilledString)),
          );
          return values;
        },
      },
      {
        key: "area",
        label: "Fläche",
        getOptions: (groups) => {
          const safeGroups = Array.isArray(groups) ? groups : [];
          const values = Array.from(new Set(safeGroups.map((group) => group.competitionarea).filter(isNumber)));
          return ["", ...values.map((value) => String.fromCharCode(65 + value))];
        },
        getValue: (group) => {
          const value = group.competitionarea;
          return value === undefined || value === null ? "" : String.fromCharCode(65 + value);
        },
      },
      {
        key: "category",
        label: "Kategorie",
        getOptions: (groups) => {
          const values = Array.from(
            new Set(groups.flatMap((group) => group.categories?.map((category) => category.categoryname).filter(isFilledString) ?? [])),
          );

          return ["", ...values.sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()))];
        },
        getValue: (group) => {
          return Array.from(new Set((group.categories ?? []).map((category) => category.categoryname).filter(isFilledString)));
        },
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  // Filters for the title row, the cards below show the filtered start groups.
  const [filterOn, setFilterOn] = useState(false);
  const { values, setFilter, clearFilter, activeFilters, optionsByKey, filteredItems } = useFilterState(groups, filterDefinitions);

  // Translate the hook output into the shape expected by the existing SelectButton UI.
  const filterData = useMemo(
    () => ({
      clubdata: { label: "Verein", values: optionsByKey.club },
      namedata: { label: "Name", values: optionsByKey.name },
      agegroupdata: { label: "Altersgruppe", values: optionsByKey.agegroup },
      starttimedata: { label: "Startzeit", values: optionsByKey.starttime },
      areadata: { label: "Fläche", values: optionsByKey.area },
      categorydata: { label: "Kategorie", values: optionsByKey.category },
    }),
    [optionsByKey],
  );

  if (loading) {
    return (
      <Box
        sx={{
          flexGrow: 1,
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
          flexGrow: 1,
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
        flexGrow: 1,
        padding: { xs: "0px 4px", sm: "0px 16px", lg: "0px 56px" },
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
                marginBottom: { xs: "0px", sm: "16px" },
              }}
            >
              Zurück zur Startseite
            </Button>
          </Link>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              marginBottom: { lg: "32px", xs: "8px" },
              bgcolor: "primary.light",
              borderRadius: "4px",
              width: "100%",
              position: "relative",
              top: "0px",
              zIndex: "1",
            }}
          >
            <FilterHeadline
              title={event.name}
              subtitle={
                [event.date ? `Datum: ${formatDate(event.date)}` : null, event.location ? `Ort: ${event.location}` : null].filter(isFilledString).join(" - ") ||
                undefined
              }
              filterOn={filterOn}
              onToggleFilter={() => setFilterOn(!filterOn)}
              titleVariant="h3"
              subtitleVariant="h6"
            >
              <SelectButton listdata={filterData.clubdata} setFilter={(value) => setFilter("club", value)} />
              <SelectButton listdata={filterData.namedata} setFilter={(value) => setFilter("name", value)} />
              <SelectButton listdata={filterData.agegroupdata} setFilter={(value) => setFilter("agegroup", value)} />
              <SelectButton listdata={filterData.areadata} setFilter={(value) => setFilter("area", value)} />
              <SelectButton listdata={filterData.categorydata} setFilter={(value) => setFilter("category", value)} />
            </FilterHeadline>
          </Box>

          {activeFilters.map((filter) => (
            <FilterChip key={filter.key} listdata={{ label: filter.label }} filter={values[filter.key]} setFilter={() => clearFilter(filter.key)} />
          ))}

          {/* Polling stops after a long period of inactivity so that forgotten
              tabs do not keep requesting updates. */}
          {paused && (
            <Alert
              severity="info"
              sx={{ marginBottom: "8px" }}
              action={
                <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={refresh}>
                  Aktualisieren
                </Button>
              }
            >
              Automatische Aktualisierung pausiert.
            </Alert>
          )}
        </Box>

        {/* Groups */}
        {groups.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            Noch keine Ergebnisse verfügbar.
          </Typography>
        ) : filteredItems.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            Keine Startgruppen für die gewählten Filter.
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
            {filteredItems.map((group, index) => (
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

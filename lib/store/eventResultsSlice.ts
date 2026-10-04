import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { TEvent, TStartgroup } from "@/lib/db";
import type { TRequestStatus } from "./eventsSlice";

// Holds the database content of a single event (a_events -> a_startgroups ->
// a_categories -> a_forms -> a_participants) exactly as it is delivered by
// GET /api/events/[slug].
export type TEventResults = {
  event: TEvent | null;
  groups: TStartgroup[];
  status: TRequestStatus;
  error: string | null;
  lastUpdated: number | null;
};

export type TEventResultsState = {
  bySlug: Record<string, TEventResults>;
};

const initialState: TEventResultsState = {
  bySlug: {},
};

const createEmptyEntry = (): TEventResults => ({
  event: null,
  groups: [],
  status: "idle",
  error: null,
  lastUpdated: null,
});

const ensureEntry = (state: TEventResultsState, slug: string): TEventResults => {
  const entry = state.bySlug[slug] ?? createEmptyEntry();
  state.bySlug[slug] = entry;

  return entry;
};

export type TFetchEventResultsArg = string | { slug: string; version?: string | null };

const toFetchArgs = (arg: TFetchEventResultsArg): { slug: string; version: string | null } => {
  return typeof arg === "string" ? { slug: arg, version: null } : { slug: arg.slug, version: arg.version ?? null };
};

export const fetchEventResults = createAsyncThunk<{ event: TEvent; groups: TStartgroup[] }, TFetchEventResultsArg>(
  "eventResults/fetchEventResults",
  async (arg) => {
    const { slug, version } = toFetchArgs(arg);

    // Passing the known revision makes the URL change with the data, so the CDN
    // can cache the (expensive) payload and still never answer with stale results.
    const url = version ? `/api/events/${encodeURIComponent(slug)}?v=${encodeURIComponent(version)}` : `/api/events/${encodeURIComponent(slug)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch results");
    }

    return (await response.json()) as { event: TEvent; groups: TStartgroup[] };
  },
);

const slugOfArg = (arg: TFetchEventResultsArg): string => toFetchArgs(arg).slug;

const eventResultsSlice = createSlice({
  name: "eventResults",
  initialState,
  reducers: {
    // Seeds the store with data that was already rendered on the server, so the
    // client does not have to call the API again on the first page view.
    setEventResults(state, action: PayloadAction<{ slug: string; event: TEvent; groups: TStartgroup[] }>) {
      const entry = ensureEntry(state, action.payload.slug);
      entry.status = "succeeded";
      entry.error = null;
      entry.event = action.payload.event;
      entry.groups = action.payload.groups ?? [];
      entry.lastUpdated = Date.now();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEventResults.pending, (state, action) => {
        const entry = ensureEntry(state, slugOfArg(action.meta.arg));
        entry.status = "loading";
        entry.error = null;
      })
      .addCase(fetchEventResults.fulfilled, (state, action) => {
        const entry = ensureEntry(state, slugOfArg(action.meta.arg));
        entry.status = "succeeded";
        entry.error = null;
        entry.event = action.payload.event;
        entry.groups = action.payload.groups ?? [];
        entry.lastUpdated = Date.now();
      })
      .addCase(fetchEventResults.rejected, (state, action) => {
        const entry = ensureEntry(state, slugOfArg(action.meta.arg));
        entry.status = "failed";
        entry.error = action.error.message ?? "An error occurred";
      });
  },
});

export const { setEventResults } = eventResultsSlice.actions;

export default eventResultsSlice.reducer;

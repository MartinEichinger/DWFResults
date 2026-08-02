import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
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

export const fetchEventResults = createAsyncThunk<{ event: TEvent; groups: TStartgroup[] }, string>("eventResults/fetchEventResults", async (slug) => {
  const response = await fetch(`/api/events/${encodeURIComponent(slug)}`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to fetch results");
  }

  return (await response.json()) as { event: TEvent; groups: TStartgroup[] };
});

const eventResultsSlice = createSlice({
  name: "eventResults",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEventResults.pending, (state, action) => {
        const entry = ensureEntry(state, action.meta.arg);
        entry.status = "loading";
        entry.error = null;
      })
      .addCase(fetchEventResults.fulfilled, (state, action) => {
        const entry = ensureEntry(state, action.meta.arg);
        entry.status = "succeeded";
        entry.error = null;
        entry.event = action.payload.event;
        entry.groups = action.payload.groups ?? [];
        entry.lastUpdated = Date.now();
      })
      .addCase(fetchEventResults.rejected, (state, action) => {
        const entry = ensureEntry(state, action.meta.arg);
        entry.status = "failed";
        entry.error = action.error.message ?? "An error occurred";
      });
  },
});

export default eventResultsSlice.reducer;

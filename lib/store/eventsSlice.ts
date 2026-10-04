import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { TEvent } from "@/lib/db";

export type TRequestStatus = "idle" | "loading" | "succeeded" | "failed";

export type TEventsState = {
  items: TEvent[];
  status: TRequestStatus;
  error: string | null;
};

const initialState: TEventsState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchEvents = createAsyncThunk<TEvent[]>("events/fetchEvents", async () => {
  // The endpoint is cached on the CDN for five minutes, so the default caching
  // behaviour is used instead of forcing a request through to a function.
  const response = await fetch("/api/events");

  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }

  const data = (await response.json()) as { events?: TEvent[] };

  return data.events ?? [];
});

const eventsSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    // Seeds the store with data that was already rendered on the server, so the
    // client does not have to call the API again on the first page view.
    setEvents(state, action: PayloadAction<TEvent[]>) {
      state.items = action.payload;
      state.status = "succeeded";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "An error occurred";
      });
  },
});

export const { setEvents } = eventsSlice.actions;

export default eventsSlice.reducer;

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
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
  const response = await fetch("/api/events", { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }

  const data = (await response.json()) as { events?: TEvent[] };

  return data.events ?? [];
});

const eventsSlice = createSlice({
  name: "events",
  initialState,
  reducers: {},
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

export default eventsSlice.reducer;

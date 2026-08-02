import { configureStore } from "@reduxjs/toolkit";
import eventsReducer from "./eventsSlice";
import eventResultsReducer from "./eventResultsSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      events: eventsReducer,
      eventResults: eventResultsReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export const selectEvents = (state: RootState) => state.events;
export const selectEventResults = (state: RootState, slug: string) => state.eventResults.bySlug[slug];

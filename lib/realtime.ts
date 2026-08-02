import { EventEmitter } from "events";

// Notification that is sent to all connected clients as soon as the database
// was changed through one of the API routes.
export type TDatabaseUpdate = {
  slug: string;
  updatedAt: number;
};

const CHANNEL = "database-update";

// Next.js recreates modules on every hot reload in development, therefore the
// emitter is kept on globalThis so that already connected clients stay attached.
const globalForRealtime = globalThis as typeof globalThis & {
  __dwfDatabaseUpdateEmitter?: EventEmitter;
};

const emitter = globalForRealtime.__dwfDatabaseUpdateEmitter ?? new EventEmitter();
// Every connected browser adds one listener, so the default limit of 10 does not apply here.
emitter.setMaxListeners(0);
globalForRealtime.__dwfDatabaseUpdateEmitter = emitter;

export function publishDatabaseUpdate(slug: string): void {
  const update: TDatabaseUpdate = { slug, updatedAt: Date.now() };
  emitter.emit(CHANNEL, update);
}

export function subscribeToDatabaseUpdates(listener: (update: TDatabaseUpdate) => void): () => void {
  emitter.on(CHANNEL, listener);

  return () => {
    emitter.off(CHANNEL, listener);
  };
}

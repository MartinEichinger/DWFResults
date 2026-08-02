import { subscribeToDatabaseUpdates } from "@/lib/realtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HEARTBEAT_INTERVAL_MS = 25_000;

// Server-Sent-Events endpoint. The client keeps this connection open and refreshes
// the redux store whenever the event with the given slug was changed in the database.
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const encoder = new TextEncoder();

  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const cleanup = () => {
    unsubscribe?.();
    unsubscribe = null;

    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const enqueue = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // The client closed the connection while a message was being written.
          cleanup();
        }
      };

      enqueue(`event: ready\ndata: ${JSON.stringify({ slug })}\n\n`);

      unsubscribe = subscribeToDatabaseUpdates((update) => {
        if (update.slug !== slug) {
          return;
        }

        enqueue(`event: update\ndata: ${JSON.stringify(update)}\n\n`);
      });

      heartbeat = setInterval(() => {
        enqueue(": heartbeat\n\n");
      }, HEARTBEAT_INTERVAL_MS);

      request.signal.addEventListener("abort", () => {
        cleanup();

        try {
          controller.close();
        } catch {
          // Stream is already closed.
        }
      });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

import { useEffect, useRef } from "react";
import { API_BASE_URL, getMediaTicket } from "@/services/apiClient";

export type LiveEvent =
  | { type: "message"; classroom_id: string; student_id: string; parent_id: string | null }
  | { type: "announcement"; classroom_id: string };

type Listener = (e: LiveEvent) => void;
const listeners = new Set<Listener>();
let source: EventSource | null = null;

// One EventSource per tab, opened while at least one component listens. The browser reconnects on its own.
function connect() {
  const ticket = getMediaTicket();
  if (source || !ticket || typeof EventSource === "undefined") return;
  source = new EventSource(`${API_BASE_URL}/messages/stream?t=${encodeURIComponent(ticket)}`);
  // An expired ticket makes the browser give up (EventSource closes on 401): reopen with the current ticket.
  source.onerror = () => {
    if (source?.readyState !== EventSource.CLOSED) return;
    source = null;
    setTimeout(() => listeners.size > 0 && connect(), 5000);
  };
  source.onmessage = (m) => {
    try {
      const event = JSON.parse(m.data) as LiveEvent;
      listeners.forEach((fn) => fn(event));
    } catch {
      // ignore malformed frames
    }
  };
}

function disconnect() {
  source?.close();
  source = null;
}

/** Calls handler whenever the server says a thread or a class feed changed. */
export function useLiveEvents(handler: Listener) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const fn: Listener = (e) => ref.current(e);
    listeners.add(fn);
    connect();
    return () => {
      listeners.delete(fn);
      if (listeners.size === 0) disconnect();
    };
  }, []);
}

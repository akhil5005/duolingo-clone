/**
 * The single place the frontend talks to the backend.
 *
 * Two things here exist purely because the API is hosted on a free tier that
 * sleeps after 15 minutes: a request that takes longer than three seconds flips
 * a global "slow" flag (the wake-up banner subscribes to it), and a request that
 * fails at the network level is retried once, because the first request to a
 * sleeping instance is the one that gets dropped.
 */

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
const SLOW_REQUEST_MS = 3000;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

let pendingSlowRequests = 0;
const slowListeners = new Set<() => void>();

function publishSlowState(): void {
  slowListeners.forEach((listener) => listener());
}

export function subscribeToSlowRequests(listener: () => void): () => void {
  slowListeners.add(listener);
  return () => slowListeners.delete(listener);
}

export function hasSlowRequest(): boolean {
  return pendingSlowRequests > 0;
}

/** Server snapshots never change between renders, so the value is a constant. */
export function hasSlowRequestOnServer(): boolean {
  return false;
}

interface SlowRequestTracker {
  done: () => void;
}

function trackSlowRequest(): SlowRequestTracker {
  let counted = false;
  const timer = setTimeout(() => {
    counted = true;
    pendingSlowRequests += 1;
    publishSlowState();
  }, SLOW_REQUEST_MS);

  return {
    done: () => {
      clearTimeout(timer);
      if (counted) {
        pendingSlowRequests = Math.max(0, pendingSlowRequests - 1);
        publishSlowState();
      }
    },
  };
}

async function toApiError(response: Response): Promise<ApiError> {
  let detail = `Request failed with status ${response.status}`;
  let code = "HTTP_ERROR";
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object") {
      const parsed = body as { detail?: unknown; code?: unknown };
      if (typeof parsed.detail === "string") detail = parsed.detail;
      if (typeof parsed.code === "string") code = parsed.code;
    }
  } catch {
    // A non-JSON body (a proxy error page, say) keeps the generic message.
  }
  return new ApiError(detail, response.status, code);
}

async function request<T>(path: string, init: RequestInit, isRetry = false): Promise<T> {
  const tracker = trackSlowRequest();
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
      cache: "no-store",
    });

    if (!response.ok) throw await toApiError(response);
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // fetch only rejects for network-level failures: retry once, then give up.
    if (!isRetry) return request<T>(path, init, true);
    throw new ApiError(
      "Could not reach the server. It may still be waking up - please try again.",
      0,
      "NETWORK_ERROR",
    );
  } finally {
    tracker.done();
  }
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

export const apiDocsUrl = `${BASE_URL}/docs`;

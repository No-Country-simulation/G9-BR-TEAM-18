import { vi } from "vitest";

export const API_URL = "http://localhost:8080";
export const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

export function mockResponse(ok: boolean, data: unknown): Response {
  return { ok, json: () => Promise.resolve(data), headers: new Headers() } as Response;
}

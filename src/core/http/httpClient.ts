import axios, { type AxiosInstance } from "axios";
import { env } from "../../config/env";
import type { HttpRequestOptions, HttpResponse } from "./httpTypes";

// Helpers internos (Phase 1)
function safeSize(value: unknown): number | undefined {
  try {
    if (value == null) return 0;
    const s = typeof value === "string" ? value : JSON.stringify(value);
    return Buffer.byteLength(s, "utf8");
  } catch {
    return undefined;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function endpointKeyFallback(method: string, url: string) {
  return `${method.toUpperCase()} ${url}`;
}

function getCurrentTestContext():
  | { name: string; meta?: { endpointKey?: string } }
  | undefined {
  return (globalThis as any).__QA_CURRENT_TEST__;
}

export class HttpClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: env.timeoutMs,
      validateStatus: () => true,
    });
  }

  setAuthToken(token: string) {
    // tu API usa x-api-key (ok)
    this.client.defaults.headers.common["x-api-key"] = `${token}`;
  }

  clearAuthToken() {
    delete this.client.defaults.headers.common["x-api-key"];
  }

  private registerHttpEvent(args: {
    method: string;
    url: string;
    status: number;
    durationMs: number;
    reqBody?: unknown;
    resBody?: unknown;
  }) {
    const ctx = getCurrentTestContext();
    const testName = ctx?.name ?? "unknown-test";
    const endpointKey =
      ctx?.meta?.endpointKey ?? endpointKeyFallback(args.method, args.url);

    globalThis.__QA_COLLECTOR__?.registerHttp({
      testName,
      endpointKey,
      method: args.method.toUpperCase(),
      url: args.url,
      status: args.status,
      durationMs: args.durationMs,
      reqSize: safeSize(args.reqBody),
      resSize: safeSize(args.resBody),
      timestamp: nowIso(),
      errorFingerprint: args.status >= 500 ? `http_${args.status}` : undefined,
    });
  }

  async get<T>(
    url: string,
    opts: HttpRequestOptions = {},
  ): Promise<HttpResponse<T>> {
    const started = Date.now();
    try {
      const res = await this.client.get(url, {
        params: opts.params,
        headers: opts.headers,
      });
      const durationMs = Date.now() - started;

      this.registerHttpEvent({
        method: "GET",
        url,
        status: res.status,
        durationMs,
        resBody: res.data,
      });

      return {
        status: res.status,
        data: res.data,
        headers: res.headers as any,
      };
    } catch (err: any) {
      const durationMs = Date.now() - started;

      this.registerHttpEvent({
        method: "GET",
        url,
        status: 0,
        durationMs,
        resBody: { message: err?.message, code: err?.code },
      });

      return { status: 0, data: undefined as any, headers: {} as any };
    }
  }

  async post<T>(
    url: string,
    body?: unknown,
    opts: HttpRequestOptions = {},
  ): Promise<HttpResponse<T>> {
    const started = Date.now();

    const res = await this.client.post(url, body, {
      params: opts.params,
      headers: opts.headers,
    });

    const durationMs = Date.now() - started;

    this.registerHttpEvent({
      method: "POST",
      url,
      status: res.status,
      durationMs,
      reqBody: body,
      resBody: res.data,
    });

    return { status: res.status, data: res.data, headers: res.headers as any };
  }

  async put<T>(
    url: string,
    body?: unknown,
    opts: HttpRequestOptions = {},
  ): Promise<HttpResponse<T>> {
    const started = Date.now();

    const res = await this.client.put(url, body, {
      params: opts.params,
      headers: opts.headers,
    });

    const durationMs = Date.now() - started;

    this.registerHttpEvent({
      method: "PUT",
      url,
      status: res.status,
      durationMs,
      reqBody: body,
      resBody: res.data,
    });

    return { status: res.status, data: res.data, headers: res.headers as any };
  }

  async delete<T>(
    url: string,
    opts: HttpRequestOptions = {},
  ): Promise<HttpResponse<T>> {
    const started = Date.now();

    const res = await this.client.delete(url, {
      params: opts.params,
      headers: opts.headers,
    });

    const durationMs = Date.now() - started;

    this.registerHttpEvent({
      method: "DELETE",
      url,
      status: res.status,
      durationMs,
      reqBody: undefined,
      resBody: res.data,
    });

    return { status: res.status, data: res.data, headers: res.headers as any };
  }
}

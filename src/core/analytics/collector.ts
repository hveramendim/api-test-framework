import type { RunContext } from "../run/runContext";
import type { TestMeta } from "../testing/testMeta";

export type HttpEvent = {
  testName: string;
  endpointKey: string;
  method: string;
  url: string;
  status: number;
  durationMs: number;
  reqSize?: number;
  resSize?: number;
  timestamp: string;
  errorFingerprint?: string;
};

export type TestResult = {
  name: string;
  suite?: string;
  status: "passed" | "failed" | "skipped";
  durationMs: number;
  error?: { message: string; stack?: string };
  meta?: any; // ✅ o TestMeta si quieres tipado fuerte
};

export type RunReport = {
  run: RunContext;
  tests: TestResult[];
  http: HttpEvent[];
};

class Collector {
  private run!: RunContext;
  private tests: TestResult[] = [];
  private http: HttpEvent[] = [];

  init(run: RunContext) {
    this.run = run;
  }

  registerTest(t: TestResult) {
    this.tests.push({
      name: t.name,
      suite: t.suite,
      status: t.status,
      durationMs: t.durationMs,
      error: t.error,
      meta: t.meta, // ✅ aquí estaba el hueco
    });
  }

  registerHttp(ev: HttpEvent) {
    this.http.push(ev);
  }

  snapshot(): RunReport {
    return { run: this.run, tests: this.tests, http: this.http };
  }
}

export const collector = new Collector();

// Tip: expón global para que lo usen helpers sin imports circulares
declare global {
  // eslint-disable-next-line no-var
  var __QA_COLLECTOR__: Collector | undefined;
}
globalThis.__QA_COLLECTOR__ = collector;

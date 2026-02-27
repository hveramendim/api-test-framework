import { beforeAll, afterAll, afterEach } from "vitest";
import { createRunContext } from "../../core/run/runContext";
import { collector } from "../../core/analytics/collector";
import { writeRunArtifacts } from "../../core/evidence/evidenceWriter";

function mapVitestStateToStatus(
  state: unknown,
): "passed" | "failed" | "skipped" {
  if (state === "pass" || state === "passed") return "passed";
  if (state === "fail" || state === "failed") return "failed";
  return "skipped"; // incluye "run", undefined, "skip", etc.
}

function extractVitestError(
  task: any,
): { message: string; stack?: string } | undefined {
  // Vitest puede exponer error como `errors: []` o `error`
  const first =
    task?.result?.error ??
    (Array.isArray(task?.result?.errors) ? task.result.errors[0] : undefined);

  if (!first) return undefined;

  return {
    message: String(first?.message ?? first),
    stack: first?.stack ? String(first.stack) : undefined,
  };
}

beforeAll(() => {
  const run = createRunContext();
  collector.init(run);
});

afterEach((ctx) => {
  const task: any = (ctx as any).task;

  const state = task?.result?.state;
  const status = mapVitestStateToStatus(state);

  const err = extractVitestError(task);

  const meta = (globalThis as any).__QA_CURRENT_TEST__?.meta;

  collector.registerTest({
    name: String(task?.name ?? "unknown-test"),
    suite: String(task?.suite?.name ?? "unknown-suite"),
    status,
    durationMs: Number(task?.result?.duration ?? 0),
    error: err,
    meta, // ✅ ahora sí llega
  });

  // ✅ recién aquí limpiamos (después de registrar)
  (globalThis as any).__QA_CURRENT_TEST__ = undefined;
});

afterAll(() => {
  const report = collector.snapshot();
  writeRunArtifacts(report);
});

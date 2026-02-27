import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export type RunContext = {
  runId: string;
  startedAt: string;
  env: string;
  branch?: string;
  commitSha?: string;
  pipelineUrl?: string;
};

function readLastRunDir(): string | undefined {
  try {
    const p = path.join(process.cwd(), "reports", ".last-run-dir");
    if (!fs.existsSync(p)) return undefined;

    const raw = fs.readFileSync(p, "utf8").trim();
    // el file puede guardar "run-xxx" o "reports/runs/run-xxx"
    const last = raw.split(/[\\/]/).pop();
    return last || undefined;
  } catch {
    return undefined;
  }
}

export function createRunContext(): RunContext {
  const startedAt = new Date().toISOString();

  const commitSha = process.env.GIT_COMMIT || process.env.BUILD_SOURCEVERSION;
  const branch = process.env.GIT_BRANCH || process.env.BUILD_SOURCEBRANCHNAME;
  const pipelineUrl = process.env.BUILD_BUILDURI || process.env.GITHUB_RUN_URL;

  const env = process.env.ENV ?? "qa";

  // 1) prioridad: RUN_ID (si lo seteas en scripts/CI)
  // 2) si no existe, usa reports/.last-run-dir (del reporter)
  // 3) si no existe, genera uno nuevo
  const runId =
    process.env.RUN_ID ??
    readLastRunDir() ??
    `run-${startedAt.replace(/[:.]/g, "-")}-${crypto.randomBytes(3).toString("hex")}`;

  return { runId, startedAt, env, branch, commitSha, pipelineUrl };
}

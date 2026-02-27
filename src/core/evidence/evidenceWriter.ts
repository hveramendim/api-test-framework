import fs from "node:fs";
import path from "node:path";
import type { RunReport } from "../analytics/collector";

function toArrayTags(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map(String).filter(Boolean);
}

function toRisk(v: unknown): "HIGH" | "MEDIUM" | "LOW" | "NONE" {
  const r = String(v ?? "").toUpperCase();
  if (r === "HIGH" || r === "MEDIUM" || r === "LOW") return r;
  return "NONE";
}

export function writeRunArtifacts(report: RunReport) {
  const baseDir = path.join(
    process.cwd(),
    "reports",
    "runs",
    report.run.runId,
    "evidence",
  );

  fs.mkdirSync(baseDir, { recursive: true });

  // 1) run.raw.json (debug completo)
  fs.writeFileSync(
    path.join(baseDir, "run.raw.json"),
    JSON.stringify(report, null, 2),
    "utf8",
  );

  // 2) run.summary.json (EJECUTIVO FUNCIONAL + Taxonomía)
  const passed = report.tests.filter((t) => t.status === "passed").length;
  const failed = report.tests.filter((t) => t.status === "failed").length;
  const skipped = report.tests.filter((t) => t.status === "skipped").length;

  // ✅ Risk summary
  const riskSummary = report.tests.reduce(
    (acc, t) => {
      const risk = toRisk((t as any).meta?.risk);
      acc[risk] = (acc[risk] ?? 0) + 1;
      return acc;
    },
    {} as Record<"HIGH" | "MEDIUM" | "LOW" | "NONE", number>,
  );

  // ✅ Tags summary
  const tagsSummary = report.tests.reduce((acc, t) => {
    const tags = toArrayTags((t as any).meta?.tags);
    for (const tag of tags) {
      acc[tag] = (acc[tag] ?? 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // ✅ Suite/domain summary (opcional, si lo capturas)
  // Si todavía NO estás guardando suite en el test, simplemente quedará vacío.
  const suiteSummary = report.tests.reduce((acc, t) => {
    const suite = String((t as any).suite ?? (t as any).meta?.suite ?? "").trim();
    if (!suite) return acc;
    acc[suite] = (acc[suite] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const summary = {
    run: report.run,
    totals: { passed, failed, skipped, total: report.tests.length },
    passRate: report.tests.length
      ? Number(((passed / report.tests.length) * 100).toFixed(2))
      : 0,

    // ✅ NUEVO: taxonomía
    riskSummary,
    tagsSummary,
    suiteSummary,

    // ✅ tests fallidos con contexto
    failedTests: report.tests
      .filter((t) => t.status === "failed")
      .slice(0, 20)
      .map((t) => ({
        name: t.name,
        suite: String((t as any).suite ?? (t as any).meta?.suite ?? "") || null,
        risk: toRisk((t as any).meta?.risk),
        tags: toArrayTags((t as any).meta?.tags),
        durationMs: t.durationMs ?? 0,
        errorMessage: t.error?.message ?? null,
      })),
  };

  fs.writeFileSync(
    path.join(baseDir, "run.summary.json"),
    JSON.stringify(summary, null, 2),
    "utf8",
  );
}

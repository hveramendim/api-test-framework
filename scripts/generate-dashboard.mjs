import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const reportsDir = path.join(ROOT, "reports");
const runsDir = path.join(reportsDir, "runs");
const dashboardPath = path.join(reportsDir, "index.html");

/** ---------- helpers ---------- */
function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function safeReadJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function parseJUnit(xml) {
  const rootMatch =
    xml.match(/<testsuites\b[^>]*>/i) || xml.match(/<testsuite\b[^>]*>/i);
  if (!rootMatch) return null;

  const tag = rootMatch[0];
  const getNum = (name, def = 0) => {
    const m = tag.match(new RegExp(`${name}="([^"]+)"`, "i"));
    return m ? Number(m[1]) : def;
  };

  const tests = getNum("tests", 0);
  const failures = getNum("failures", 0);
  const errors = getNum("errors", 0);
  const skipped = getNum("skipped", 0);
  const time = Number((tag.match(/time="([^"]+)"/i) || [])[1] ?? 0);

  const failedTotal = failures + errors;
  const passed = Math.max(0, tests - failedTotal - skipped);
  return { tests, passed, failed: failedTotal, skipped, time };
}

function fmtSeconds(sec) {
  const n = Number(sec ?? 0);
  if (!n || n < 0.001) return "0.00s";
  if (n < 60) return `${n.toFixed(2)}s`;
  const m = Math.floor(n / 60);
  const s = n - m * 60;
  return `${m}m ${s.toFixed(1)}s`;
}

function fmtMs(ms) {
  const n = Number(ms ?? 0);
  if (!n) return "0ms";
  if (n < 1000) return `${Math.round(n)}ms`;
  return `${(n / 1000).toFixed(2)}s`;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function riskBadge(risk) {
  const r = String(risk ?? "").toUpperCase();
  if (!r || r === "NONE") return `<span class="muted">-</span>`;
  const cls = r === "HIGH" ? "fail" : r === "MEDIUM" ? "skip" : "ok";
  return `<span class="badge ${cls}">${escapeHtml(r)}</span>`;
}

function tagsBadges(tags) {
  const arr = Array.isArray(tags) ? tags : [];
  if (!arr.length) return `<span class="muted">-</span>`;
  return arr
    .map((t) => `<span class="badge info">${escapeHtml(t)}</span>`)
    .join(" ");
}

/** ---------- API Calls ---------- */
function pickApiCalls(raw) {
  const http = Array.isArray(raw?.http) ? raw.http : [];
  return http.map((e) => ({
    endpointKey:
      e.endpointKey ?? `${e.method ?? ""} ${e.path ?? e.url ?? ""}`.trim(),
    method: e.method ?? "",
    url: e.url ?? e.path ?? "",
    status: e.status ?? e.statusCode ?? "",
    durationMs: e.durationMs ?? e.duration ?? 0,
    error: e.error ?? null,
  }));
}

function buildApiPanel(raw, limit = 12) {
  const calls = pickApiCalls(raw);
  if (!calls.length) {
    return `<div class="muted">No se registraron llamadas HTTP en este run (http[] vacío).</div>`;
  }

  const top = calls.slice(0, limit);
  const rows = top
    .map((c) => {
      const isBad =
        typeof c.status === "number"
          ? c.status >= 400
          : String(c.status).startsWith("4") ||
            String(c.status).startsWith("5");

      const cls = isBad ? "fail" : "ok";

      return `
        <tr>
          <td><span class="badge info">${escapeHtml(c.method || "-")}</span></td>
          <td><b>${escapeHtml(c.endpointKey || "-")}</b><div class="muted">${escapeHtml(c.url || "")}</div></td>
          <td><span class="badge ${cls}">${escapeHtml(c.status || "N/A")}</span></td>
          <td>${fmtMs(c.durationMs)}</td>
          <td class="muted">${escapeHtml(c.error?.message ?? c.error ?? "-")}</td>
        </tr>
      `;
    })
    .join("");

  const more =
    calls.length > limit
      ? `<div class="muted" style="margin-top:6px;">Mostrando ${limit} de ${calls.length} llamadas. Ver detalle completo en <b>run.raw.json</b>.</div>`
      : "";

  return `
    <table>
      <thead>
        <tr>
          <th style="width:90px;">Method</th>
          <th>Endpoint</th>
          <th style="width:90px;">Status</th>
          <th style="width:90px;">Time</th>
          <th>Error</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${more}
  `;
}

/** ---------- Tests Panel (qaTest + describe) ---------- */
function buildTestsPanel(runRaw) {
  const tests = Array.isArray(runRaw?.tests) ? runRaw.tests : [];
  if (!tests.length) {
    return `<div class="muted">No hay tests en run.raw.json</div>`;
  }

  const rows = tests
    .map((t) => {
      const st = String(t?.status ?? "-");
      const stCls = st === "passed" ? "ok" : st === "failed" ? "fail" : "skip";

      const meta = t?.meta ?? null;

      return `
        <tr>
          <td><b>${escapeHtml(t?.name ?? "-")}</b></td>
          <td class="muted">${escapeHtml(t?.suite ?? "-")}</td>
          <td><span class="badge ${stCls}">${escapeHtml(st)}</span></td>
          <td>${fmtMs(t?.durationMs ?? 0)}</td>
          <td>${riskBadge(meta?.risk)}</td>
          <td>${tagsBadges(meta?.tags)}</td>
          <td class="muted">${escapeHtml(meta?.endpointKey ?? "-")}</td>
          <td class="muted">${escapeHtml(meta?.domain ?? "-")}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <table>
      <thead>
        <tr>
          <th>Test (qaTest name)</th>
          <th style="width:190px;">Suite (describe)</th>
          <th style="width:90px;">Status</th>
          <th style="width:90px;">Time</th>
          <th style="width:90px;">Risk</th>
          <th>Tags</th>
          <th style="width:170px;">EndpointKey</th>
          <th style="width:170px;">Domain</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

/** ---------- main ---------- */
if (!fs.existsSync(runsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(
    dashboardPath,
    "<h1>No hay ejecuciones aún</h1><p>Corre: npm run test:qa</p>",
    "utf8",
  );
  console.log("[DASHBOARD] No runs. Se generó:", dashboardPath);
  process.exit(0);
}

const runs = fs
  .readdirSync(runsDir)
  .filter((f) => f.startsWith("run-"))
  .sort()
  .reverse();

const rows = runs.map((run) => {
  const junitPath = path.join(runsDir, run, "junit", "results.xml");
  const evidenceDir = path.join(runsDir, run, "evidence");

  const runSummaryPath = path.join(evidenceDir, "run.summary.json");
  const runRawPath = path.join(evidenceDir, "run.raw.json");

  const runSummary = safeReadJson(runSummaryPath);
  const runRaw = safeReadJson(runRawPath);

  const xml = safeRead(junitPath);
  const junitStats = xml ? parseJUnit(xml) : null;

  const totals = runSummary?.totals
    ? runSummary.totals
    : junitStats
      ? {
          passed: junitStats.passed,
          failed: junitStats.failed,
          skipped: junitStats.skipped,
          total: junitStats.tests,
        }
      : { passed: 0, failed: 0, skipped: 0, total: 0 };

  const passRate =
    typeof runSummary?.passRate === "number"
      ? runSummary.passRate
      : totals.total
        ? Number(((totals.passed / totals.total) * 100).toFixed(2))
        : 0;

  const statusClass = totals.failed > 0 ? "fail" : "ok";
  const statusText = totals.failed > 0 ? "FAIL" : "PASS";
  const time = junitStats?.time ? fmtSeconds(junitStats.time) : "N/A";

  const hasEvidence = fs.existsSync(runSummaryPath);

  const failedTests = Array.isArray(runSummary?.failedTests)
    ? runSummary.failedTests
    : [];

  const failedTestsHtml = failedTests.length
    ? `
      <div class="panel" style="margin-top:10px;">
        <h3>❌ Tests fallidos (top ${Math.min(20, failedTests.length)})</h3>
        <ul class="muted" style="margin:6px 0 0 18px;">
          ${failedTests
            .slice(0, 20)
            .map(
              (t) =>
                `<li><b>${escapeHtml(t.name)}</b> — ${escapeHtml(t.errorMessage ?? "sin mensaje")}</li>`,
            )
            .join("")}
        </ul>
      </div>
    `
    : "";

  const testsPanelHtml = `
    <div class="panel" style="margin-top:10px;">
      <h3>🧪 Tests (este run)</h3>
      ${buildTestsPanel(runRaw)}
      <div class="muted" style="margin-top:6px;">
        * Para ver Risk/Tags aquí, asegúrate que tu evidence writer incluya <b>meta</b> dentro de cada item de <b>tests[]</b> en run.raw.json
      </div>
    </div>
  `;

  const apiPanelHtml = `
    <div class="panel" style="margin-top:10px;">
      <h3>🔌 API Calls (este run)</h3>
      ${buildApiPanel(runRaw, 12)}
    </div>
  `;

  return {
    run,
    totals,
    passRate,
    statusClass,
    statusText,
    time,
    hasEvidence,
    links: {
      html: `./runs/${run}/html/index.html`,
      junit: `./runs/${run}/junit/results.xml`,
      runSummary: `./runs/${run}/evidence/run.summary.json`,
      runRaw: `./runs/${run}/evidence/run.raw.json`,
    },
    hasRunRaw: fs.existsSync(runRawPath),
    failedTestsHtml,
    testsPanelHtml,
    apiPanelHtml,
  };
});

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>QA Dashboard Local</title>
  <style>
    body{font-family:Arial;padding:20px;max-width:1180px;margin:0 auto;}
    .run{border:1px solid #ddd;border-radius:12px;padding:14px;margin:12px 0;}
    .top{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center;}
    .name{font-weight:bold;font-size:14px;}
    .badges{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
    .badge{padding:4px 10px;border-radius:999px;font-size:12px;border:1px solid #ccc;white-space:nowrap;}
    .ok{background:#e8f5e9;border-color:#a5d6a7;}
    .fail{background:#ffebee;border-color:#ef9a9a;}
    .skip{background:#fff8e1;border-color:#ffe082;}
    .time{background:#e3f2fd;border-color:#90caf9;}
    .info{background:#f3f4f6;border-color:#e5e7eb;}
    a{display:inline-block;margin-right:12px;margin-top:8px;text-decoration:none;color:#1976d2;}
    a:hover{text-decoration:underline;}
    .meta{color:#666;font-size:12px;margin-top:6px;}
    .muted{color:#888;font-size:12px;}
    .panel{border:1px solid #eee;border-radius:10px;padding:12px;background:#fafafa;}
    .panel h3{margin:0 0 8px 0;font-size:13px;}
    table{width:100%;border-collapse:collapse;}
    th,td{border-bottom:1px solid #eee;padding:6px 6px;font-size:12px;text-align:left;vertical-align:top;}
    th{color:#333;}
  </style>
</head>
<body>
  <h1>🧪 QA Dashboard Local</h1>
  <p class="muted">Histórico de ejecuciones (solo funcional): HTML/JUnit + Evidence + detalle de API calls.</p>

  <h2 style="margin-top:18px;">📚 Histórico de Runs</h2>

  ${rows
    .map((r) => {
      const { passed, failed, skipped, total } = r.totals;

      const evidenceBadge = r.hasEvidence
        ? `<span class="badge ok">📦 evidence</span>`
        : `<span class="badge info">📦 sin evidence</span>`;

      const runRawLink = r.hasRunRaw
        ? `<a href="${r.links.runRaw}" target="_blank">🧩 run.raw</a>`
        : "";

      return `
      <div class="run">
        <div class="top">
          <div class="name">${r.run}</div>
          <div class="badges">
            <span class="badge ${r.statusClass}">${r.statusText}</span>
            ${evidenceBadge}
            <span class="badge time">⏱ ${r.time}</span>
            <span class="badge ok">✅ ${passed}</span>
            <span class="badge fail">❌ ${failed}</span>
            <span class="badge skip">⏭ ${skipped}</span>
            <span class="badge">🧪 ${total} tests</span>
            <span class="badge info">📈 ${r.passRate}%</span>
          </div>
        </div>

        <div>
          <a href="${r.links.html}" target="_blank">📊 HTML</a>
          <a href="${r.links.junit}" target="_blank">📄 JUnit</a>
          <a href="${r.links.runSummary}" target="_blank">🧾 run.summary</a>
          ${runRawLink}
        </div>

        ${r.failedTestsHtml}
        ${r.testsPanelHtml}
        ${r.apiPanelHtml}

        <div class="meta">Ruta: reports/runs/${r.run}</div>
      </div>
      `;
    })
    .join("")}
</body>
</html>`;

fs.writeFileSync(dashboardPath, html, "utf8");
console.log("[DASHBOARD] Generado:", dashboardPath);

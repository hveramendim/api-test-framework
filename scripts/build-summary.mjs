// scripts/build-summary.mjs
import fs from "node:fs";

const junitPath = process.argv[2] || "reports/junit.xml";
const outPath = process.argv[3] || "reports/summary.md";

if (!fs.existsSync(junitPath)) {
  console.error(`❌ JUnit not found: ${junitPath}`);
  process.exit(0); // no rompas el pipeline por dashboard
}

const xml = fs.readFileSync(junitPath, "utf8");

// Helpers (simple XML extraction)
function findAll(re, s) {
  const out = [];
  let m;
  while ((m = re.exec(s)) !== null) out.push(m);
  return out;
}

function pick(tag, name) {
  const m = new RegExp(`${name}="([^"]*)"`, "i").exec(tag);
  return m ? m[1] : "";
}

// Extract testcases
const testcases = findAll(/<testcase\b[^>]*>([\s\S]*?)<\/testcase>|<testcase\b[^\/]*\/>/g, xml);

let total = 0, failed = 0, skipped = 0, passed = 0;

const failByRisk = new Map();
const failByDomain = new Map();
const topFailures = [];

for (const t of testcases) {
  total++;

  const whole = t[0];
  const openTagMatch = /<testcase\b([^>]*)>/.exec(whole) || /<testcase\b([^\/]*)\/>/.exec(whole);
  const openAttrs = openTagMatch ? openTagMatch[1] : "";
  const name = pick(openAttrs, "name") || "(no-name)";

  const hasFailure = /<failure\b/i.test(whole) || /<error\b/i.test(whole);
  const hasSkipped = /<skipped\b/i.test(whole);

  if (hasSkipped) skipped++;
  else if (hasFailure) failed++;
  else passed++;

  if (hasFailure) {
    const risk = (/\[RISK:([A-Z]+)\]/.exec(name)?.[1]) || "UNKNOWN";
    const domain = (/\[DOMAIN:([^\]]+)\]/.exec(name)?.[1]) || "UNKNOWN";

    failByRisk.set(risk, (failByRisk.get(risk) || 0) + 1);
    failByDomain.set(domain, (failByDomain.get(domain) || 0) + 1);

    // Message corto
    const msg =
      (/<failure\b[^>]*message="([^"]*)"/i.exec(whole)?.[1]) ||
      (/<error\b[^>]*message="([^"]*)"/i.exec(whole)?.[1]) ||
      "Failure";

    topFailures.push({
      name,
      msg: msg.replace(/\s+/g, " ").trim().slice(0, 160),
    });
  }
}

topFailures.sort((a, b) => a.name.localeCompare(b.name));

function mapToSortedRows(map) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

const passRate = total ? Math.round((passed / total) * 100) : 0;

// Pipeline context (optional env vars)
const env = process.env.TEST_ENV || process.env.ENVIRONMENT || "";
const scope = process.env.RUN_SCOPE || "";
const filter = process.env.FILTER || "";

let md = `# 🧪 API Automation Summary\n\n`;
md += `**Total:** ${total} | ✅ **Passed:** ${passed} | ❌ **Failed:** ${failed} | ⏭️ **Skipped:** ${skipped} | **Pass rate:** ${passRate}%\n\n`;

if (env || scope || filter) {
  md += `## Context\n\n`;
  md += `- **Environment:** ${env || "N/A"}\n`;
  md += `- **Scope:** ${scope || "N/A"}\n`;
  md += `- **Filter:** ${filter || "(none)"}\n\n`;
}

md += `## ❌ Failures by Risk\n\n`;
md += `| Risk | Failures |\n|---|---:|\n`;
for (const [k, v] of mapToSortedRows(failByRisk)) md += `| ${k} | ${v} |\n`;
if (failByRisk.size === 0) md += `| - | 0 |\n`;

md += `\n## ❌ Failures by Domain\n\n`;
md += `| Domain | Failures |\n|---|---:|\n`;
for (const [k, v] of mapToSortedRows(failByDomain)) md += `| ${k} | ${v} |\n`;
if (failByDomain.size === 0) md += `| - | 0 |\n`;

md += `\n## 🔥 Top Failures (up to 10)\n\n`;
if (topFailures.length === 0) {
  md += `No failures 🎉\n`;
} else {
  md += `| Test | Message |\n|---|---|\n`;
  for (const f of topFailures.slice(0, 10)) {
    const safeName = f.name.replace(/\|/g, "\\|");
    const safeMsg = f.msg.replace(/\|/g, "\\|");
    md += `| ${safeName} | ${safeMsg} |\n`;
  }
}

fs.mkdirSync(outPath.split("/").slice(0, -1).join("/") || ".", { recursive: true });
fs.writeFileSync(outPath, md, "utf8");

console.log(`✅ Summary generated: ${outPath}`);

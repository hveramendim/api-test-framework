import fs from "node:fs";

function pad(n) {
  return String(n).padStart(2, "0");
}

const d = new Date();
const stamp =
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_` +
  `${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;

const runDir = `reports/runs/run-${stamp}`;

// ✅ NO borrar reports, solo crear un run nuevo
fs.mkdirSync(`${runDir}/html`, { recursive: true });
fs.mkdirSync(`${runDir}/junit`, { recursive: true });

// Guardamos el "último run" para que Vitest config lo lea
fs.writeFileSync("reports/.last-run-dir", runDir, "utf8");

console.log(`[REPORTS] runDir=${runDir}`);

import { defineConfig } from "vitest/config";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";

dotenv.config({
  path: path.resolve(process.cwd(), `.env.${process.env.ENV ?? "qa"}`),
  override: true,
});

function getRunDir() {
  try {
    const p = path.resolve(process.cwd(), "reports/.last-run-dir");
    const dir = fs.readFileSync(p, "utf8").trim();
    return dir || "reports";
  } catch {
    return "reports";
  }
}

const runDir = getRunDir();

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ["./src/tests/setup/vitest.setup.ts"],
    pool: "threads",
    reporters: [
      "default",
      ["html", { outputFile: `${runDir}/html/index.html` }],
      ["junit", { outputFile: `${runDir}/junit/results.xml` }],
    ],
  },
});

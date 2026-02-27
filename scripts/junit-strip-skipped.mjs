#!/usr/bin/env node
/**
 * Strip skipped testcases from a JUnit XML file (Vitest/Jest style).
 *
 * - Removes <testcase> nodes that contain <skipped/> or <skipped>...</skipped>
 * - Recomputes testsuite/testsuites counters: tests, skipped/disabled, failures, errors, time
 *
 * Usage:
 *   node scripts/junit-strip-skipped.mjs reports/junit.xml
 *   node scripts/junit-strip-skipped.mjs reports/junit.xml reports/junit.filtered.xml
 */

import fs from "node:fs";
import path from "node:path";

const inPath = process.argv[2] || "reports/junit.xml";
const outPath = process.argv[3] || inPath;

if (!fs.existsSync(inPath)) {
  console.error(`❌ Input file not found: ${inPath}`);
  process.exit(1);
}

let xml = fs.readFileSync(inPath, "utf8");

// Normalize newlines for easier regex work
xml = xml.replace(/\r\n/g, "\n");

/**
 * Helpers
 */
const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const sumTimesFromTestcases = (suiteXml) => {
  // Sum time="x.y" from testcase nodes
  const re = /<testcase\b[^>]*\btime="([^"]+)"[^>]*>/g;
  let m;
  let sum = 0;
  while ((m = re.exec(suiteXml))) sum += toNumber(m[1]);
  return sum;
};

const countTag = (suiteXml, tag) => {
  const re = new RegExp(`<${tag}\\b`, "g");
  const matches = suiteXml.match(re);
  return matches ? matches.length : 0;
};

const countTestcases = (suiteXml) => {
  const matches = suiteXml.match(/<testcase\b/g);
  return matches ? matches.length : 0;
};

const stripSkippedTestcases = (suiteXml) => {
  // Remove any <testcase>...</testcase> that contains a <skipped .../> or <skipped>...</skipped>
  // Also covers <testcase ...><skipped/></testcase> with other nested nodes.
  return suiteXml.replace(
    /<testcase\b[\s\S]*?<\/testcase>/g,
    (tc) => (/<skipped\b[\s\S]*?\/>|<skipped\b[\s\S]*?<\/skipped>/.test(tc) ? "" : tc),
  );
};

const updateSuiteAttrs = (suiteXml) => {
  const tests = countTestcases(suiteXml);
  const failures = countTag(suiteXml, "failure");
  const errors = countTag(suiteXml, "error");

  // After stripping, skipped should be 0
  const skipped = 0;

  // Prefer summing testcase time for accuracy
  const time = sumTimesFromTestcases(suiteXml).toFixed(3);

  // Update attributes on <testsuite ...>
  suiteXml = suiteXml.replace(/<testsuite\b([^>]*)>/, (full, attrs) => {
    const setAttr = (name, value) => {
      const re = new RegExp(`\\b${name}="[^"]*"`);
      if (re.test(attrs)) return attrs.replace(re, `${name}="${value}"`);
      return `${attrs} ${name}="${value}"`;
    };

    let a = attrs;

    a = setAttr("tests", tests);
    a = setAttr("failures", failures);
    a = setAttr("errors", errors);

    // Some junit variants use skipped, others disabled
    a = setAttr("skipped", skipped);
    a = setAttr("disabled", skipped);

    a = setAttr("time", time);

    return `<testsuite${a}>`;
  });

  return suiteXml;
};

const updateTestsuitesAttrs = (rootXml) => {
  // Update the <testsuites ...> aggregated counts if present
  if (!/<testsuites\b/.test(rootXml)) return rootXml;

  // Sum attributes from each <testsuite ...>
  const suiteOpenRe = /<testsuite\b([^>]*)>/g;

  let tests = 0;
  let failures = 0;
  let errors = 0;
  let skipped = 0;
  let time = 0;

  let m;
  while ((m = suiteOpenRe.exec(rootXml))) {
    const attrs = m[1];

    const get = (name) => {
      const r = new RegExp(`\\b${name}="([^"]*)"`);
      const mm = r.exec(attrs);
      return mm ? mm[1] : null;
    };

    tests += toNumber(get("tests"));
    failures += toNumber(get("failures"));
    errors += toNumber(get("errors"));
    skipped += toNumber(get("skipped")) || toNumber(get("disabled"));
    time += toNumber(get("time"));
  }

  const timeFixed = time.toFixed(3);

  rootXml = rootXml.replace(/<testsuites\b([^>]*)>/, (full, attrs) => {
    const setAttr = (name, value) => {
      const re = new RegExp(`\\b${name}="[^"]*"`);
      if (re.test(attrs)) return attrs.replace(re, `${name}="${value}"`);
      return `${attrs} ${name}="${value}"`;
    };

    let a = attrs;
    a = setAttr("tests", tests);
    a = setAttr("failures", failures);
    a = setAttr("errors", errors);
    a = setAttr("skipped", skipped);
    a = setAttr("disabled", skipped);
    a = setAttr("time", timeFixed);

    return `<testsuites${a}>`;
  });

  return rootXml;
};

/**
 * Main transform:
 * - If file has <testsuites> with nested suites, process each suite block.
 * - If file has only <testsuite>, process that single suite.
 */
let out = xml;

if (/<testsuites\b/.test(xml)) {
  // Process each <testsuite>...</testsuite> block
  out = out.replace(/<testsuite\b[\s\S]*?<\/testsuite>/g, (suiteBlock) => {
    let s = suiteBlock;
    s = stripSkippedTestcases(s);
    s = updateSuiteAttrs(s);
    return s;
  });

  out = updateTestsuitesAttrs(out);
} else if (/<testsuite\b/.test(xml)) {
  // Single-suite file
  out = stripSkippedTestcases(out);
  out = updateSuiteAttrs(out);
} else {
  console.error("❌ Not a valid JUnit XML (no <testsuite/testsuites> found).");
  process.exit(1);
}

// Cleanup: remove empty lines introduced by deletions
out = out.replace(/\n{3,}/g, "\n\n");

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out, "utf8");

console.log(`✅ Stripped skipped testcases. Output: ${outPath}`);

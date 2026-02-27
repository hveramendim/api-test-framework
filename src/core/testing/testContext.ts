import type { TestMeta } from "./testMeta";

let currentTestName: string | undefined;
let currentTestMeta: TestMeta | undefined;

export function setCurrentTestContext(name: string, meta: TestMeta) {
  currentTestName = name;
  currentTestMeta = meta;
}

export function clearCurrentTestContext() {
  currentTestName = undefined;
  currentTestMeta = undefined;
}

export function getCurrentTestName() {
  return currentTestName;
}

export function getCurrentTestMeta() {
  return currentTestMeta;
}
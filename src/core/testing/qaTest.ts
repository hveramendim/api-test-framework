import { test } from "vitest";

type Risk = "LOW" | "MEDIUM" | "HIGH";

type QaTestMeta = {
  tags?: string[];       // ["@TC-10235"]
  domain?: string;       // "pet_store"
  risk?: Risk;           // "HIGH"
  endpointKey?: string;  // "POST /user/createWithArray"
};

export function qaTest(
  title: string,
  meta: QaTestMeta,
  fn: () => Promise<void> | void
) {
  const tags = (meta.tags ?? []).map(t => String(t).trim()).filter(Boolean);

  const domainPrefix = meta.domain ? `[DOMAIN:${meta.domain}] ` : "";
  const endpointPrefix = meta.endpointKey ? `[EP:${meta.endpointKey}] ` : "";
  const riskPrefix = meta.risk ? `[RISK:${meta.risk}] ` : "";
  const tagsPrefix = tags.length ? `[${tags.join(" ")}] ` : "";

  const testName = `${domainPrefix}${endpointPrefix}${riskPrefix}${tagsPrefix}${title}`;

  // 👇 meta estructurada (para el collector y el reporte)
  const structuredMeta = {
    tags,
    domain: meta.domain,
    risk: meta.risk,
    endpointKey: meta.endpointKey,
  };

  return test(testName, async () => {
    // ✅ set context para que:
    // - afterEach lo lea y lo guarde en run.raw.json.tests[].meta
    // - httpClient lo use para http[].testName y http[].endpointKey
    (globalThis as any).__QA_CURRENT_TEST__ = {
      name: testName,
      meta: structuredMeta,
    };

    // Ejecuta el test
    await fn();
    // ⚠️ No limpies aquí: afterEach ya lo limpia después de registrar
  });
}
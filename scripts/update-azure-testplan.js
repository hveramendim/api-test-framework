#!/usr/bin/env node
/**
 * update-azure-testplan.js
 *
 * Sincroniza resultados JUnit a Azure Test Plans (Plan/Suite) en Azure DevOps.
 * - Crea Test Run asociado a plan y test points del suite
 * - Publica resultados (Passed/Failed/Skipped)
 * - Completa el run
 *
 * Node: 20+ (usa fetch nativo)
 *
 * Requiere:
 *   npm i xml2js
 *
 * Variables de entorno:
 *   AZDO_ORG_URL  ej: https://dev.azure.com/miOrg
 *   AZDO_PAT      PAT con permisos (Test Management RW + Work Items R si usas WIQL)
 *
 * Ejemplo:
 *   node scripts/update-azure-testplan.js \
 *     --targetProject "demoQA" \
 *     --environment "QA" \
 *     --mode "PLAN_SUITE" \
 *     --testPlanId 123 \
 *     --testSuiteId 456 \
 *     --testCases "TC101,TC102" \
 *     --junit "reports/junit.xml" \
 *     --reportsDir "reports"
 */

'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { parseStringPromise } = require('xml2js');

/* =========================
 * Utilidades
 * ========================= */

class AppError extends Error {
  constructor(message, { code = 'APP_ERROR', cause } = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    if (cause) this.cause = cause;
  }
}

class Logger {
  constructor({ verbose = false } = {}) {
    this.verbose = verbose;
  }
  info(msg) { console.log(`[INFO] ${msg}`); }
  warn(msg) { console.warn(`[WARN] ${msg}`); }
  error(msg) { console.error(`[ERROR] ${msg}`); }
  debug(msg) { if (this.verbose) console.log(`[DEBUG] ${msg}`); }
}

function parseArgs(argv) {
  // parser minimalista estilo GNU: --key value, --flag
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

function requireNonEmpty(value, name) {
  if (!value || String(value).trim() === '') {
    throw new AppError(`Falta parámetro requerido: ${name}`, { code: 'VALIDATION' });
  }
  return String(value).trim();
}

function toInt(value, name) {
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) throw new AppError(`Parámetro inválido (no numérico): ${name}=${value}`, { code: 'VALIDATION' });
  return n;
}

function splitCsv(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

/* =========================
 * Cliente Azure DevOps REST
 * ========================= */

class AzdoClient {
  constructor({ orgUrl, pat, logger, userAgent = 'update-azure-testplan/1.0' }) {
    this.orgUrl = orgUrl.replace(/\/+$/, '');
    this.pat = pat;
    this.log = logger;
    this.userAgent = userAgent;
  }

  #authHeader() {
    // Basic base64(":PAT")
    const token = Buffer.from(`:${this.pat}`, 'utf8').toString('base64');
    return `Basic ${token}`;
  }

  async request(method, url, { body, headers } = {}) {
    const finalHeaders = {
      'Authorization': this.#authHeader(),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': this.userAgent,
      ...(headers || {})
    };

    const opts = {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined
    };

    // Retry simple para 429/5xx
    const maxRetries = 4;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const res = await fetch(url, opts);
      const text = await res.text();
      const isJson = (res.headers.get('content-type') || '').includes('application/json');

      const payload = text ? (isJson ? safeJson(text) : text) : null;

      if (res.ok) return payload;

      const retryable = res.status === 429 || (res.status >= 500 && res.status <= 599);
      const msg = `HTTP ${res.status} ${res.statusText} -> ${url} :: ${truncate(text, 400)}`;

      if (!retryable || attempt === maxRetries) {
        throw new AppError(msg, { code: 'AZDO_HTTP', cause: payload });
      }

      const backoff = 500 * Math.pow(2, attempt);
      this.log.warn(`${msg} | retry en ${backoff}ms (attempt ${attempt + 1}/${maxRetries})`);
      await sleep(backoff);
    }
  }

  buildUrl(project, apiPathAndQuery) {
    // apiPathAndQuery debe iniciar con "/_apis/..."
    return `${this.orgUrl}/${encodeURIComponent(project)}${apiPathAndQuery}`;
  }
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function truncate(s, n) {
  const str = String(s ?? '');
  return str.length > n ? str.slice(0, n) + '…' : str;
}

/* =========================
 * Servicios Azure DevOps
 * ========================= */

class WorkItemsService {
  constructor(client) {
    this.client = client;
  }

  /**
   * Busca Test Cases por "código" dentro del título (System.Title).
   * Retorna [{ id, url }]
   */
  async findTestCasesByTitleContains(project, code) {
    // WIQL
    const wiql = {
      query: `
        SELECT [System.Id]
        FROM WorkItems
        WHERE [System.TeamProject] = @project
          AND [System.WorkItemType] = 'Test Case'
          AND [System.Title] CONTAINS '${escapeWiql(code)}'
      `
    };

    const url = this.client.buildUrl(project, `/_apis/wit/wiql?api-version=7.1`);
    const data = await this.client.request('POST', url, { body: wiql });

    const ids = (data?.workItems || []).map(w => w.id).filter(Boolean);
    return ids;
  }
}

function escapeWiql(s) {
  return String(s).replace(/'/g, "''");
}

class TestPlansService {
  constructor(client) {
    this.client = client;
  }

  async listTestPoints(project, planId, suiteId) {
    // GET test points
    // doc: GET .../_apis/testplan/Plans/{planId}/Suites/{suiteId}/points?api-version=7.1-preview.2
    const url = this.client.buildUrl(
      project,
      `/_apis/testplan/Plans/${planId}/Suites/${suiteId}/points?api-version=7.1-preview.2`
    );
    const data = await this.client.request('GET', url);
    return data?.value || [];
  }

  async createTestRun(project, { name, planId, pointIds }) {
    // POST .../_apis/test/runs?api-version=7.1-preview.3
    const url = this.client.buildUrl(project, `/_apis/test/runs?api-version=7.1-preview.3`);
    const body = {
      name,
      plan: { id: planId },
      pointIds,
      automated: true,
      state: 'InProgress'
    };
    return await this.client.request('POST', url, { body });
  }

  async addTestResults(project, runId, results) {
    // POST .../_apis/test/runs/{runId}/results?api-version=7.1-preview.6
    const url = this.client.buildUrl(
      project,
      `/_apis/test/runs/${runId}/results?api-version=7.1-preview.6`
    );
    return await this.client.request('POST', url, { body: results });
  }

  async completeTestRun(project, runId, { comment } = {}) {
    // PATCH .../_apis/test/runs/{runId}?api-version=7.1-preview.3
    const url = this.client.buildUrl(project, `/_apis/test/runs/${runId}?api-version=7.1-preview.3`);
    const body = {
      state: 'Completed',
      comment: comment || 'Run completed by pipeline'
    };
    return await this.client.request('PATCH', url, { body });
  }
}

/* =========================
 * Parser JUnit
 * ========================= */

class JUnitParser {
  constructor({ logger }) {
    this.log = logger;
  }

  /**
   * Retorna lista de casos:
   * [{ name, classname, outcome, durationMs, message }]
   */
  async parseFile(junitPath) {
    const xml = await fs.readFile(junitPath, 'utf8').catch(err => {
      throw new AppError(`No se pudo leer JUnit en: ${junitPath}`, { code: 'IO', cause: err });
    });

    const parsed = await parseStringPromise(xml, {
      explicitArray: false,
      mergeAttrs: true,
      trim: true
    }).catch(err => {
      throw new AppError(`No se pudo parsear JUnit XML`, { code: 'JUNIT_PARSE', cause: err });
    });

    const suites = normalizeToArray(parsed.testsuite || parsed.testsuites?.testsuite);
    const out = [];

    for (const suite of suites) {
      const testcases = normalizeToArray(suite.testcase);
      for (const tc of testcases) {
        const name = tc.name || '';
        const classname = tc.classname || '';
        const timeSec = Number(tc.time || 0);
        const durationMs = Math.round(timeSec * 1000);

        let outcome = 'Passed';
        let message = '';

        if (tc.failure) {
          outcome = 'Failed';
          message = extractJUnitMessage(tc.failure);
        } else if (tc.error) {
          outcome = 'Failed';
          message = extractJUnitMessage(tc.error);
        } else if (tc.skipped) {
          outcome = 'NotExecuted'; // o "Skipped" no siempre existe como outcome
          message = extractJUnitMessage(tc.skipped);
        }

        out.push({ name, classname, outcome, durationMs, message });
      }
    }

    this.log.info(`JUnit: ${out.length} testcases encontrados`);
    return out;
  }
}

function normalizeToArray(x) {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}

function extractJUnitMessage(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  // xml2js puede traer { _: 'mensaje', message: '...' }
  return node.message || node._ || JSON.stringify(node);
}

/* =========================
 * Mapeo JUnit -> Test Case IDs / Test Points
 * ========================= */

class ResultMapper {
  constructor({ logger }) {
    this.log = logger;
  }

  /**
   * Intenta extraer un "código" tipo TC123 del nombre del test.
   */
  extractCodeFromTestName(name) {
    const m = String(name).match(/\bTC\d+\b/i);
    return m ? m[0].toUpperCase() : null;
  }

  /**
   * Si el usuario pasa --testCases con números, se asumen IDs directos.
   * Si son tipo TC123, se usan como "códigos" para buscar por título.
   */
  parseUserTestCases(rawList) {
    const items = splitCsv(rawList);
    const numericIds = [];
    const codes = [];

    for (const it of items) {
      if (/^\d+$/.test(it)) numericIds.push(Number(it));
      else codes.push(it.toUpperCase());
    }

    return { numericIds, codes };
  }
}

/* =========================
 * Orquestador
 * ========================= */

class SyncRunner {
  constructor({ client, testPlans, workItems, junitParser, mapper, logger }) {
    this.client = client;
    this.testPlans = testPlans;
    this.workItems = workItems;
    this.junitParser = junitParser;
    this.mapper = mapper;
    this.log = logger;
  }

  async run(options) {
    const {
      targetProject,
      environment,
      mode,
      testPlanId,
      testSuiteId,
      testCasesRaw,
      junitPath
    } = options;

    // 1) Parse JUnit
    const junitCases = await this.junitParser.parseFile(junitPath);

    // 2) Obtener test points del suite
    const points = await this.testPlans.listTestPoints(targetProject, testPlanId, testSuiteId);
    this.log.info(`Suite points: ${points.length}`);

    // Construimos índice: testCaseId -> [point]
    const pointsByTestCaseId = new Map();
    for (const p of points) {
      const tcId = p?.testCase?.id ? Number(p.testCase.id) : null;
      if (!tcId) continue;
      if (!pointsByTestCaseId.has(tcId)) pointsByTestCaseId.set(tcId, []);
      pointsByTestCaseId.get(tcId).push(p);
    }

    // 3) Determinar qué TestCase IDs targetear
    let targetTestCaseIds = new Set();

    if (mode === 'PLAN_SUITE') {
      for (const tcId of pointsByTestCaseId.keys()) targetTestCaseIds.add(tcId);
      this.log.info(`Modo PLAN_SUITE: target TestCases = ${targetTestCaseIds.size}`);
    } else if (mode === 'TESTCASES') {
      const { numericIds, codes } = this.mapper.parseUserTestCases(testCasesRaw);

      numericIds.forEach(id => targetTestCaseIds.add(id));

      // Si vienen códigos tipo TC123, buscar IDs por título
      for (const code of codes) {
        const ids = await this.workItems.findTestCasesByTitleContains(targetProject, code);
        if (!ids.length) {
          this.log.warn(`No encontré Test Case para código '${code}' (buscando en título).`);
          continue;
        }
        ids.forEach(id => targetTestCaseIds.add(id));
      }

      this.log.info(`Modo TESTCASES: target TestCases = ${targetTestCaseIds.size}`);
    } else {
      throw new AppError(`mode inválido: ${mode}`, { code: 'VALIDATION' });
    }

    // 4) Mapeo JUnit -> outcome por TestCaseId
    // Estrategia:
    // - Si el nombre del test contiene "TC123" => buscamos ese TC por título y asignamos resultado
    // - Si no contiene código, no se puede mapear (warning)
    const outcomeByTestCaseId = new Map(); // tcId -> { outcome, durationMs, message, name }
    const cacheCodeToIds = new Map(); // "TC123" -> [ids]

    for (const t of junitCases) {
      const code = this.mapper.extractCodeFromTestName(t.name);
      if (!code) {
        this.log.debug(`JUnit sin código TC en nombre: '${t.name}'`);
        continue;
      }

      let ids = cacheCodeToIds.get(code);
      if (!ids) {
        ids = await this.workItems.findTestCasesByTitleContains(targetProject, code);
        cacheCodeToIds.set(code, ids);
      }
      if (!ids.length) {
        this.log.warn(`JUnit tiene '${code}' pero no existe Test Case con ese código en título.`);
        continue;
      }

      for (const id of ids) {
        // si ya hay un resultado previo, aplica una regla: Failed domina, luego Passed, luego NotExecuted.
        const prev = outcomeByTestCaseId.get(id);
        const merged = mergeOutcome(prev, t);
        outcomeByTestCaseId.set(id, merged);
      }
    }

    // 5) Construir lista final de results para points que estén en targetTestCaseIds
    const results = [];
    const pointIds = [];

    for (const tcId of targetTestCaseIds) {
      const tcPoints = pointsByTestCaseId.get(tcId) || [];
      if (!tcPoints.length) {
        this.log.warn(`TestCase ${tcId} no tiene points en este suite (plan ${testPlanId}, suite ${testSuiteId}).`);
        continue;
      }

      // Tomamos el primer point (si hay varios configs, podrías iterarlos todos)
      for (const p of tcPoints) {
        const pointId = Number(p.id);
        pointIds.push(pointId);

        const mapped = outcomeByTestCaseId.get(tcId);
        if (!mapped) {
          // Si no hay JUnit para ese TC, lo dejamos NotExecuted
          results.push(buildResult({
            testCaseId: tcId,
            testPointId: pointId,
            outcome: 'NotExecuted',
            durationMs: 0,
            message: 'Sin resultado JUnit asociado',
            automatedTestName: `TC${tcId}`,
            environment
          }));
          continue;
        }

        results.push(buildResult({
          testCaseId: tcId,
          testPointId: pointId,
          outcome: mapped.outcome,
          durationMs: mapped.durationMs,
          message: mapped.message,
          automatedTestName: mapped.name || `TC${tcId}`,
          environment
        }));
      }
    }

    if (!pointIds.length) {
      throw new AppError(`No hay test points a actualizar (pointIds vacío).`, { code: 'NO_POINTS' });
    }

    this.log.info(`Resultados a publicar: ${results.length} (points: ${pointIds.length})`);

    // 6) Crear run
    const runName = `API Tests (${environment}) - Plan ${testPlanId} Suite ${testSuiteId}`;
    const run = await this.testPlans.createTestRun(targetProject, {
      name: runName,
      planId: testPlanId,
      pointIds
    });

    const runId = run?.id;
    if (!runId) throw new AppError(`No se pudo crear Test Run (sin id).`, { code: 'AZDO_RUN' });

    this.log.info(`Test Run creado: ${runId}`);

    // 7) Publicar results (en batches por si son muchos)
    const batchSize = 200;
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      await this.testPlans.addTestResults(targetProject, runId, batch);
      this.log.info(`Publicado batch results ${i + 1}-${Math.min(i + batchSize, results.length)}`);
    }

    // 8) Completar run
    await this.testPlans.completeTestRun(targetProject, runId, {
      comment: `Synced by pipeline. Env=${environment}. Results=${results.length}`
    });

    this.log.info(`Run completado: ${runId}`);
  }
}

function mergeOutcome(prev, current) {
  // regla: Failed > Passed > NotExecuted
  const rank = (o) => (o === 'Failed' ? 3 : o === 'Passed' ? 2 : 1);

  if (!prev) return { ...current };

  const prevRank = rank(prev.outcome || prev);
  const curRank = rank(current.outcome);

  return (curRank >= prevRank)
    ? { ...current }
    : { ...prev };
}

function buildResult({ testCaseId, testPointId, outcome, durationMs, message, automatedTestName, environment }) {
  // Azure Test outcome típicos: Passed, Failed, NotExecuted
  // state: Completed
  return {
    testCase: { id: String(testCaseId) },
    testPoint: { id: String(testPointId) },
    outcome,
    state: 'Completed',
    durationInMs: Number(durationMs || 0),
    errorMessage: message ? truncate(message, 1000) : undefined,
    automatedTestName: automatedTestName || `TC${testCaseId}`,
    // Campos extra útiles
    comment: `Env=${environment}`,
    // startedDate/completedDate opcional: Azure puede inferir
  };
}

/* =========================
 * Main
 * ========================= */

async function main() {
  const args = parseArgs(process.argv);

  const logger = new Logger({ verbose: Boolean(args.verbose) });

  const orgUrl = process.env.AZDO_ORG_URL;
  const pat = process.env.AZDO_PAT;

  requireNonEmpty(orgUrl, 'AZDO_ORG_URL (env)');
  requireNonEmpty(pat, 'AZDO_PAT (env)');

  const targetProject = requireNonEmpty(args.targetProject, '--targetProject');
  const environment = requireNonEmpty(args.environment, '--environment');
  const mode = requireNonEmpty(args.mode, '--mode'); // PLAN_SUITE | TESTCASES
  const testPlanId = toInt(requireNonEmpty(args.testPlanId, '--testPlanId'), '--testPlanId');
  const testSuiteId = toInt(requireNonEmpty(args.testSuiteId, '--testSuiteId'), '--testSuiteId');
  const junitPath = requireNonEmpty(args.junit, '--junit');

  const testCasesRaw = String(args.testCases || '').trim();

  if (mode === 'TESTCASES' && !testCasesRaw) {
    throw new AppError(`mode=TESTCASES requiere --testCases`, { code: 'VALIDATION' });
  }

  // validación archivo JUnit
  await fs.access(junitPath).catch(() => {
    throw new AppError(`No existe JUnit en ruta: ${junitPath}`, { code: 'IO' });
  });

  logger.info(`Org: ${orgUrl}`);
  logger.info(`Project destino: ${targetProject}`);
  logger.info(`Plan: ${testPlanId} | Suite: ${testSuiteId}`);
  logger.info(`Mode: ${mode} | Env: ${environment}`);
  if (mode === 'TESTCASES') logger.info(`TestCases: ${testCasesRaw}`);

  const client = new AzdoClient({ orgUrl, pat, logger });
  const testPlans = new TestPlansService(client);
  const workItems = new WorkItemsService(client);
  const junitParser = new JUnitParser({ logger });
  const mapper = new ResultMapper({ logger });

  const runner = new SyncRunner({
    client,
    testPlans,
    workItems,
    junitParser,
    mapper,
    logger
  });

  await runner.run({
    targetProject,
    environment,
    mode,
    testPlanId,
    testSuiteId,
    testCasesRaw,
    junitPath
  });
}

main().catch(err => {
  const code = err?.code || 'UNHANDLED';
  console.error(`[FATAL:${code}] ${err?.message || err}`);
  if (err?.cause) {
    console.error(`[CAUSE] ${typeof err.cause === 'string' ? err.cause : JSON.stringify(err.cause, null, 2)}`);
  }
  process.exit(1);
});

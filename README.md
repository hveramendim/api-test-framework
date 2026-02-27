# 📘 API Automation Framework

Framework base para automatización de pruebas de APIs usando
**TypeScript + Vitest + Axios**, diseñado para ser escalable, mantenible
y fácil de entender por el equipo de QA.

------------------------------------------------------------------------

# 🚀 Stack Tecnológico

-   TypeScript
-   Vitest (Test Runner)
-   Axios (HTTP Client encapsulado)
-   Custom HttpClient Adapter
-   Test Metadata System (qaTest)
-   HTML + JUnit Reporting
-   Environment-based configuration (.env)

------------------------------------------------------------------------

# 📂 Estructura del Proyecto

    src/
      config/              → Configuración global (env, endpoints)
      core/                → Núcleo del framework (http, testing, analytics)
      auth/                → Servicios de autenticación
      domains/             → Pruebas organizadas por dominio funcional
        promociones/
          services/        → Lógica de consumo de endpoints
          models/          → Tipos y DTOs
          contracts/       → Validaciones de contrato
          tests/           → Archivos de prueba
    tests/
      setup/               → Configuración global de Vitest
    docs/                  → Documentación técnica
    scripts/               → Generación de reportes

------------------------------------------------------------------------

# ⚙️ Instalación

    npm install

------------------------------------------------------------------------

# ▶️ Ejecución de Pruebas

### QA

    npm run test:qa

### STG

    npm run test:stg

### Generar Reporte

    npm run reports:qa

------------------------------------------------------------------------

# 🌍 Manejo de Ambientes

El framework soporta múltiples ambientes mediante variables de entorno:

    .env.qa
    .env.stg

Ejemplo:

    BASE_URL=https://api.qa.midominio.com
    DEFAULT_MALL_ID=123
    DEFAULT_CHANNEL=web
    IDENTITY_CLIENT_ID=xxxx
    IDENTITY_CLIENT_SECRET=xxxx

⚠️ Nunca subir secretos reales al repositorio. Solo se deben versionar
archivos `.env.example`.

------------------------------------------------------------------------

# 🧱 Cómo Crear un Nuevo Dominio

Ejemplo: `users`

## 1️⃣ Crear estructura

    src/domains/users/
      services/
        users.service.ts
      models/
        users.types.ts
      contracts/
        users.contract.ts
      tests/
        users.get.test.ts

------------------------------------------------------------------------

## 2️⃣ Crear Service

``` ts
export class UsersService {
  constructor(private http: HttpClient) {}

  async getUsers() {
    return this.http.get('/v1/users');
  }
}
```

------------------------------------------------------------------------

## 3️⃣ Crear Test

``` ts
qaTest(
  'GET Users - 200 OK',
  {
    tags: ['smoke'],
    risk: 'low',
    endpointKey: 'GET /v1/users'
  },
  async () => {
    const response = await usersService.getUsers();

    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
  }
);
```

------------------------------------------------------------------------

# 🧪 Estándares Obligatorios

-   No usar axios directamente en tests.
-   No hardcodear URLs.
-   No hardcodear tokens.
-   Cada test debe usar qaTest().
-   Tests deben ser independientes.
-   Naming:
    -   \*.test.ts
    -   \*.negative.test.ts
    -   \*.contract.test.ts

------------------------------------------------------------------------

# 📊 Reporting

El framework genera:

-   Reporte HTML
-   Reporte JUnit XML
-   Dashboard interno (metadata analytics)

Ubicación:

    reports/

------------------------------------------------------------------------

# 🔐 Autenticación

Toda autenticación debe gestionarse desde:

    src/auth/

Nunca generar tokens manualmente dentro de un test.

------------------------------------------------------------------------

# 🛠 Checklist antes de hacer PR

-   [ ] El test usa qaTest()
-   [ ] No hay URLs hardcodeadas
-   [ ] No hay tokens hardcodeados
-   [ ] El test es independiente
-   [ ] El nombre del archivo sigue la convención
-   [ ] El test pasa en QA

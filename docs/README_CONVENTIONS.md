🚨 Regla crítica

Todo test debe usar qaTest.

📖 ¿Qué es qaTest?

Wrapper que:

Ejecuta tests

Agrega metadata

Registra evidencia

🎯 Beneficios

✔ Reportes consistentes
✔ Métricas ejecutivas
✔ Integración CI

🏷️ Naming estándar

Formato:

[Dominio][Tipo][Resultado]

🧪 Ejemplos
[Users][HP] Crear usuario válido
[Auth][Negative] Login con token inválido

📊 Clasificación Risk
High

Impacto negocio crítico.

Medium

Funcionalidad principal.

Low

Validaciones complementarias.

📘 README_ONBOARDING.md (Expandido)
🎯 Objetivo onboarding

Permitir que QA nuevo:

Ejecute framework

Entienda arquitectura

Cree tests correctamente

🟢 Setup técnico

QA debe:

✔ Instalar dependencias
✔ Configurar variables entorno
✔ Ejecutar pruebas existentes

🟢 Comprensión arquitectura

QA debe entender:

Service Layer

HttpClient Adapter

Collector

runContext

🟢 Desarrollo tests

QA debe:

Crear models

Crear service

Crear test

Agregar metadata

🟢 Checklist PR

Antes de merge:

✔ Usa qaTest
✔ Naming correcto
✔ Sin lógica HTTP en tests
✔ Metadata completa
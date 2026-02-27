🎯 ¿Qué es este proyecto?

Este proyecto es un framework de automatización de pruebas de APIs diseñado para entornos empresariales donde:

Existen múltiples servicios

Se requiere regresión continua

Se necesita evidencia automatizada

Los equipos QA deben escalar pruebas sin perder calidad

📌 ¿Qué es un Framework de Testing?

Un framework es una estructura organizada que define:

Cómo se crean pruebas

Cómo se ejecutan

Cómo se reportan

Qué estándares deben seguir los QA

👉 No es solo ejecutar tests, es una plataforma de calidad.

🧠 Objetivo principal del framework

Resolver problemas comunes en testing de APIs:

Problema	Solución del framework
Tests duplicados	Service Layer
Requests inconsistentes	HttpClient Adapter
Evidencia manual	Collector automático
Tests difíciles de mantener	Arquitectura por dominios
Baja trazabilidad	Metadata QA
🧩 Patrones Arquitectónicos
🔧 Adapter Pattern (HttpClient)
📖 Definición

Un Adapter es una capa que traduce o encapsula comunicación externa.

📌 En este framework

El HttpClient:

Es el único que habla con APIs

Maneja:

Headers

Auth

Timeouts

Logging técnico

Métricas

Evidencias

🎯 ¿Por qué importa?

Si mañana cambia:

Librería HTTP

Estrategia auth

Configuración global

👉 Solo cambia el adapter
👉 Los tests NO se rompen

🧪 Ejemplo conceptual

Sin adapter:
QA repite configuración HTTP en cada test.

Con adapter:
QA solo ejecuta servicios.

🧠 Service Layer Pattern
📖 Definición

Capa que representa acciones del negocio, no endpoints técnicos.

📌 En este framework

Un service representa acciones como:

Crear usuario

Obtener lista

Login

🎯 ¿Por qué importa?

Permite:

✔ Reutilización
✔ Tests más legibles
✔ Menos duplicación
✔ Facil mantenimiento

🧪 Ejemplo conceptual

En lugar de probar:

POST /users


Se prueba:

Crear usuario válido


👉 El QA piensa en negocio, no en infraestructura.

📐 Contract-Based Testing
📖 Definición

Validar que la API cumple estructura esperada.

📌 Incluye

Tipos correctos

Campos obligatorios

Estructura JSON

Manejo de errores

🎯 ¿Por qué importa?

Detecta:

Cambios backend no documentados

Bugs silenciosos

Incompatibilidades entre sistemas

📦 ¿Qué entrega el framework?

Después de cada ejecución:

✔ Reporte JUnit
✔ Reporte HTML
✔ Evidencia JSON detallada
✔ Métricas ejecutivas

▶️ ¿Cómo se ejecuta?
🖥️ Ejecución local

QA ejecuta pruebas manualmente.

El framework:

Inicializa contexto ejecución

Ejecuta escenarios

Captura evidencias

Genera reportes

🤖 Ejecución CI/CD

Pipeline ejecuta lo mismo.

Diferencia:

Detecta entorno CI

Publica artifacts automáticamente
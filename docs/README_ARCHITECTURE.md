🏗️ Componentes globales
config/

Define configuraciones compartidas.

Ejemplo:

Clientes HTTP

Base URLs

Headers comunes

env/

Define variables entorno.

🎯 Importancia

Permite cambiar ambiente sin modificar código.

http / clients

Instancias centralizadas HttpClient.

runContext
📖 Definición

Contexto global de ejecución.

📌 Contiene

runId

Fecha ejecución

Entorno

Información CI

🎯 Importancia

Permite:

✔ Trazabilidad
✔ Auditoría
✔ Versionado evidencia

collector
📖 Definición

Recolector de resultados.

📌 Captura

Resultado test

Metadata QA

Duración

Request/Response

🔄 Flujo Completo
Paso 1

Vitest inicia ejecución.

Paso 2

Se crea runContext.

Paso 3

qaTest envuelve escenario.

Paso 4

Test ejecuta service.

Paso 5

Service usa HttpClient.

Paso 6

HttpClient ejecuta request.

Paso 7

Collector guarda resultados.

Paso 8

Se generan reportes.
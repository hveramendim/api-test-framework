🧩 ¿Qué es un Dominio?

Un dominio agrupa funcionalidades relacionadas.

📌 Ejemplos reales

Users → Manejo usuarios

Identity → Login / Auth

Payments → Transacciones

🎯 ¿Por qué usar dominios?

Permite:

✔ Escalabilidad
✔ Organización
✔ Asignación clara de ownership

📁 tests/
📖 Definición

Contiene los escenarios QA.

🎯 Responsabilidad

Validar comportamiento del sistema.

🧪 Qué contiene

Happy Path

Unhappy Paths

Negative Cases

❌ Qué NO debe contener

Configuración HTTP

URLs

Headers manuales

⚙️ service/
📖 Definición

Encapsula comunicación con APIs.

🎯 Responsabilidad

Representar acciones del negocio.

🧪 Ejemplo conceptual

Servicio:

Crear usuario


Internamente:

Construye request

Llama HttpClient

Maneja respuesta

📦 models/
📖 Definición

Define estructura de datos.

🎯 Beneficios

✔ Evita errores de tipo
✔ Facilita mantenimiento
✔ Mejora autocompletado

📐 contracts/
📖 Definición

Validaciones estructurales del API.

🎯 Beneficio

Separar validaciones técnicas del test.
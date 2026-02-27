import { DOMAINS } from "../src/config/domains.config.js";

const input = (process.argv[2] || "").trim();

if (!input) {
  console.error("❌ Dominio vacío.");
  process.exit(1);
}

if (!DOMAINS.includes(input)) {
  console.error(`❌ Dominio inválido: ${input}`);
  console.error(`✅ Dominios válidos: ${DOMAINS.join(", ")}`);
  process.exit(1);
}

console.log(`✅ Dominio válido: ${input}`);

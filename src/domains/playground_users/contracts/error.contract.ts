import { expect } from "vitest";

/**
 * Contract genérico para errores.
 * Soporta:
 * - body vacío {}
 * - body con { error: string }
 * - body con { message: string } (otras APIs típicas)
 */

export function assertErrorContract(data: unknown) {
  // Acepta body vacío
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    // si tiene error o message, deben ser string
    if ("error" in obj) {
      expect(typeof obj.error).toBe("string");
      expect((obj.error as string).length).toBeGreaterThan(0);
      return;
    }

    if ("message" in obj) {
      expect(typeof obj.message).toBe("string");
      expect((obj.message as string).length).toBeGreaterThan(0);
      return;
    }

    // si no hay keys, sigue siendo válido como "error body vacío"
    // pero al menos verificamos que sea un objeto
    return;
  }

  // Si viene string u otra cosa rara, lo marcamos como inválido
  expect.fail("Error response body no es un objeto válido");
}

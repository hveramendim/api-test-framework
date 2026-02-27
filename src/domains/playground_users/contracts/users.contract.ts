import { expect } from "vitest";
import type { ReqResUsersResponse, ReqResUser } from "../models/reqresUsers.model";

/**
 * Contract-Based Testing
 * Valida estructura mínima esperada y tipos básicos.
 * No valida reglas de negocio específicas.
 */

export function assertUsersListContract(data: ReqResUsersResponse) {
  // Root fields
  expect(data).toHaveProperty("page");
  expect(data).toHaveProperty("per_page");
  expect(data).toHaveProperty("total");
  expect(data).toHaveProperty("total_pages");
  expect(data).toHaveProperty("data");

  expect(typeof data.page).toBe("number");
  expect(typeof data.per_page).toBe("number");
  expect(typeof data.total).toBe("number");
  expect(typeof data.total_pages).toBe("number");

  // data array
  expect(Array.isArray(data.data)).toBe(true);

  // Si viene vacío, igual puede ser válido, pero tu test funcional puede exigir >0
  // Aquí solo validamos estructura si hay elementos
  if (data.data.length > 0) {
    assertUserContract(data.data[0]);
  }
}

export function assertUserContract(user: ReqResUser) {
  expect(user).toHaveProperty("id");
  expect(user).toHaveProperty("email");
  expect(user).toHaveProperty("first_name");
  expect(user).toHaveProperty("last_name");
  expect(user).toHaveProperty("avatar");

  expect(typeof user.id).toBe("number");
  expect(typeof user.email).toBe("string");
  expect(typeof user.first_name).toBe("string");
  expect(typeof user.last_name).toBe("string");
  expect(typeof user.avatar).toBe("string");

  // Validación ligera (contract-ish), sin negocio:
  expect(user.email.length).toBeGreaterThan(0);
}

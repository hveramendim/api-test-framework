// src/domains/pet_store/contracts/createWithArray/create-with-array.contract.ts

import { expect } from "vitest";
import type { CreateWithArrayResponse } from "../models/createWithArray.response.model";

/**
 * Contract-Based Testing
 * Valida estructura mínima esperada del endpoint
 * POST /user/createWithArray
 *
 * No valida reglas de negocio.
 */
export function assertCreateWithArrayContract(
  data: CreateWithArrayResponse
) {
  expect(data).toHaveProperty("code");
  expect(data).toHaveProperty("type");
  expect(data).toHaveProperty("message");

  expect(typeof data.code).toBe("number");
  expect(typeof data.type).toBe("string");
  expect(typeof data.message).toBe("string");

  expect(data.message.length).toBeGreaterThan(0);
}
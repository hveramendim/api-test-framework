import { expect } from "vitest";
import type { LoginUserResponse } from "../models/loginUser.response.model";

export function assertLoginUserContract(data: LoginUserResponse) {
  expect(data).toHaveProperty("code");
  expect(data).toHaveProperty("type");
  expect(data).toHaveProperty("message");

  expect(typeof data.code).toBe("number");
  expect(typeof data.type).toBe("string");
  expect(typeof data.message).toBe("string");

  expect(data.message.length).toBeGreaterThan(0);
}
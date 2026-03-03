// src/domains/pet_store/contracts/users.contract.ts

import { expect } from "vitest";
import type { PetStoreUser } from "../models/getByUsername.model";

export function assertPetStoreUserContract(user: PetStoreUser) {
  expect(user).toHaveProperty("id");
  expect(user).toHaveProperty("username");
  expect(user).toHaveProperty("firstName");
  expect(user).toHaveProperty("lastName");
  expect(user).toHaveProperty("email");
  expect(user).toHaveProperty("password");
  expect(user).toHaveProperty("phone");
  expect(user).toHaveProperty("userStatus");

  expect(typeof user.id === "string" || typeof user.id === "number").toBe(true);
  expect(typeof user.username).toBe("string");
  expect(typeof user.firstName).toBe("string");
  expect(typeof user.lastName).toBe("string");
  expect(typeof user.email).toBe("string");
  expect(typeof user.password).toBe("string");
  expect(typeof user.phone).toBe("string");
  expect(typeof user.userStatus).toBe("number");
}
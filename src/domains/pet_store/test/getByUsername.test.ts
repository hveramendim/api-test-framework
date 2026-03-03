import { describe, expect, beforeAll } from "vitest";
import { PetStoreUserService } from "../services/petStoreUser.service";
import { clients } from "../../../config/clients";
import { qaTest } from "../../../core/testing/qaTest";
import { PetStoreUserBuilder } from "../models/builders/user.builder";
import { assertPetStoreUserContract } from "../contracts/getByUsername.contract";

describe("Pet Store Users API", () => {
  const userService = new PetStoreUserService(clients.petStore);

  beforeAll(async () => {
    // Crear usuario 'user1' antes de los tests GET
    const user = PetStoreUserBuilder.valid({ username: "user1" });
    await userService.createWithArray([user]);
  });

  qaTest(
    "GET /user/{username} - 200 OK",
    {
      tags: ["positive", "smoke"],
      risk: "HIGH",
      endpointKey: "GET /user/{username}",
      domain: "pet_store",
    },
    async () => {
      const start = Date.now();

      const res = await userService.getUserByUsername("user1");

      const responseTime = Date.now() - start;

      expect(res.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // ⏱ validación de performance

      assertPetStoreUserContract(res.data);
      expect(res.data.username).toBe("user1");
    }
  );

  qaTest(
    "GET /user/{username} - 404 Not Found",
    {
      tags: ["negative"],
      risk: "MEDIUM",
      endpointKey: "GET /user/{username}",
      domain: "pet_store",
    },
    async () => {
      const res = await userService.getUserByUsername("nonexistent_user");
      expect(res.status).toBe(404);
    }
  );

  qaTest(
    "GET /user/{username} - 400/405 Invalid Username",
    {
      tags: ["negative"],
      risk: "MEDIUM",
      endpointKey: "GET /user/{username}",
      domain: "pet_store",
    },
    async () => {
      const res = await userService.getUserByUsername("");
      expect([400, 405]).toContain(res.status);
    }
  );
});
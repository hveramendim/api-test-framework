import { describe, expect, beforeAll } from "vitest";
import { PlaygroundUserService } from "../services/playgroundUsers.service";
import { AuthService } from "../../../auth/auth.service";
import { clients } from "../../../config/clients";
import { qaTest } from "../../../core/testing/qaTest";

import { assertUsersListContract } from "../contracts/users.contract";
import { assertResourcesListContract } from "../contracts/resources.contract";
import { assertErrorContract } from "../contracts/error.contract";

describe("Playground Users API", () => {
  const http = clients.playground;
  const usersService = new PlaygroundUserService(http);
  const authService = new AuthService();
  beforeAll(async () => {
    // const loginRes = await authService.login("test@mail.com", "123456");
    // expect(loginRes.status).toBe(200);
    // clients.playground.setAuthToken(loginRes.data.token);

    clients.playground.setAuthToken("reqres_4e3e2e9ec4154970bb13d093e233a3cb");
  });

  qaTest(
    "Validar listado de usuarios",
    {
      tags: ["@TC-10234"],
      risk: "HIGH",
      endpointKey: "GET /users",
      domain: "parking",
    },
    async () => {
      const res = await usersService.getUsers();

      // Validación de protocolo (siempre)
      expect(res.status).toBe(200);

      // Contract-based (estructura)
      assertUsersListContract(res.data);

      // Validación funcional mínima (si aplica al caso)
      expect(res.data.data.length).toBeGreaterThan(0);
    },
  );

  qaTest(
    "Validar listado de recursos",
    {
      tags: ["@TC-10235"],
      risk: "LOW",
      endpointKey: "GET /resources",
      domain: "playground_users",
    },
    async () => {
      const res = await usersService.getResources();
      expect(res.status).toBe(200);

      assertResourcesListContract(res.data);

      expect(res.data.data.length).toBeGreaterThan(0);
    },
  );
  qaTest(
    "Validar 404 al consultar usuario inexistente",
    {
      tags: ["regression", "negative"],
      risk: "MEDIUM",
      endpointKey: "GET /users/:id",
      domain: "playground_users",
    },
    async () => {
      const res = await usersService.getUser("999999");

      expect(res.status).toBe(404);

      // El body puede ser {} o traer { error/message }, validamos flexible:
      assertErrorContract(res.data);
    },
  );
});

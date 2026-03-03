import { describe, expect } from "vitest";
import { clients } from "../../../config/clients";
import { qaTest } from "../../../core/testing/qaTest";

import { PetStoreUserService } from "../services/petStoreUser.service";
import { PetStoreUserBuilder } from "../models/builders/user.builder";
import { assertDeleteUserContract } from "../contracts/deleteByUsername.contract";

describe("PetStore Users API - DELETE /user/{username}", () => {
  const http = clients.petStore;
  const userService = new PetStoreUserService(http);

  qaTest(
    "DU-HP-01 - Eliminar usuario existente",
    {
      tags: ["@DU-HP-01"],
      risk: "LOW",
      endpointKey: "DELETE /user/{username}",
      domain: "pet_store",
    },
    async () => {
      // Precondición: crear usuario primero usando createWithArray
      const user = PetStoreUserBuilder.valid({ username: `user_del_${Date.now()}` });
      const createRes = await userService.createWithArray([user]);
      expect(createRes.status).toBe(200);

      // Acción: eliminar usuario
      const delRes = await userService.deleteUser(String(user.username));

      // Protocolo
      expect(delRes.status).toBe(200);

      // Contract
      assertDeleteUserContract(delRes.data);

      expect(delRes.data.code).toBe(200);
      expect(delRes.data.message).toBe(String(user.username));
    },
  );

  qaTest(
    "DU-NEG-02 - Eliminar usuario inexistente",
    {
      tags: ["@DU-NEG-02"],
      risk: "LOW",
      endpointKey: "DELETE /user/{username}",
      domain: "pet_store",
    },
    async () => {
      const username = `user_no_exist_${Date.now()}_999`;

      const delRes = await userService.deleteUser(username);
      expect(delRes.status).toBe(404);
      if (delRes.data) {
        assertDeleteUserContract(delRes.data);
      }
    },
  );

  qaTest(
    "DU-NEG-03 - Username inválido (vacío o whitespace) - Validar que no responda 200",
    {
      tags: ["@DU-NEG-03"],
      risk: "MEDIUM",
      endpointKey: "DELETE /user/{username}",
      domain: "pet_store",
    },
    async () => {

      const username = encodeURIComponent("   ");

      const delRes = await userService.deleteUser(username);

      expect(delRes.status).toBe(404);
    },
  );

  qaTest(
    "DU-NEG-04 - Username con caracteres especiales no permitidos / mal encoding",
    {
      tags: ["@DU-NEG-04"],
      risk: "MEDIUM",
      endpointKey: "DELETE /user/{username}",
      domain: "pet_store",
    },
    async () => {

      const raw = "[]";
      //const encoded = encodeURIComponent(raw);

      const delRes = await userService.deleteUser(raw);

      expect(delRes.status).toBe(400);
    },
  );
});
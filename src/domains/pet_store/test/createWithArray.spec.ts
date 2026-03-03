import { describe, expect } from "vitest";
import { clients } from "../../../config/clients";
import { qaTest } from "../../../core/testing/qaTest";

import { PetStoreUserService } from "../services/petStoreUser.service";
import { PetStoreUserBuilder } from "../models/builders/user.builder";
import { assertCreateWithArrayContract } from "../contracts/createWithArray.contract";

describe("PetStore Users API - createWithArray", () => {
  const http = clients.petStore;
  const userService = new PetStoreUserService(http);

  qaTest(
    "CWA-HP-01 - Crear lista válida de 2 usuarios",
    {
      tags: ["@CWA-HP-01"],
      risk: "LOW",
      endpointKey: "POST /user/createWithArray",
      domain: "pet_store",
    },
    async () => {
      const body = PetStoreUserBuilder.many(2);
      //console.log("REQUEST:" + JSON.stringify(body))
      const res = await userService.createWithArray(body);
      //console.log("REQUEST:" + JSON.stringify(res))
      expect(res.status).toBe(200);
      assertCreateWithArrayContract(res.data);

      expect(res.data.code).toBe(200);
      expect(res.data.message.toLowerCase()).toBe("ok");
    },
  );

  qaTest(
    "CWA-HP-02 - Crear lista con 1 usuario",
    {
      tags: ["@CWA-HP-02"],
      risk: "LOW",
      endpointKey: "POST /user/createWithArray",
      domain: "pet_store",
    },
    async () => {
      const body = PetStoreUserBuilder.many(1);

      const res = await userService.createWithArray(body);
      expect(res.status).toBe(200);
      assertCreateWithArrayContract(res.data);
      expect(res.data.code).toBe(200);
      expect(res.data.message.toLowerCase()).toBe("ok");
    },
  );

  qaTest(
    "CWA-NEG-03 - Body nulo / sin body - Validar que no responde 200",
    {
      tags: ["@CWA-NEG-03"],
      risk: "MEDIUM",
      endpointKey: "POST /user/createWithArray",
      domain: "pet_store",
    },
    async () => {
      const res = await http.post(`/user/createWithArray`, undefined, {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
      });
      expect(res.status).toBe(405);
    },
  );

  qaTest(
    "CWA-NEG-04 - Usuario sin campos requeridos (sin username) - Registrar comportamiento real",
    {
      tags: ["@CWA-NEG-04"],
      risk: "LOW",
      endpointKey: "POST /user/createWithArray",
      domain: "pet_store",
    },
    async () => {
      const body = [PetStoreUserBuilder.missing(["username"], { id: 1, firstName: "A" })];
      const res = await userService.createWithArray(body);
      expect(res.status).toBe(200);
      assertCreateWithArrayContract(res.data);
      expect(res.data.code).toBe(200);
    },
  );

  qaTest(
    "CWA-REG-05 - Username duplicado en la misma lista - Registrar comportamiento real",
    {
      tags: ["@CWA-REG-05"],
      risk: "LOW",
      endpointKey: "POST /user/createWithArray",
      domain: "pet_store",
    },
    async () => {
      const dup = `dup_${Date.now()}`;
      const body = [
        PetStoreUserBuilder.valid({ username: dup }),
        PetStoreUserBuilder.valid({ username: dup }),
      ];

      const res = await userService.createWithArray(body);
      expect(res.status).toBe(200);
      assertCreateWithArrayContract(res.data);
      expect(res.data.code).toBe(200);
    },
  );

  qaTest(
    "CWA-REG-06 - Username con caracteres especiales",
    {
      tags: ["@CWA-REG-06"],
      risk: "LOW",
      endpointKey: "POST /user/createWithArray",
      domain: "pet_store",
    },
    async () => {
      const body = [
        PetStoreUserBuilder.valid({ username: `user.@_${Date.now()}` }),
      ];
      const res = await userService.createWithArray(body);
      expect(res.status).toBe(200);
      assertCreateWithArrayContract(res.data);
      expect(res.data.code).toBe(200);
      expect(res.data.message.toLowerCase()).toBe("ok");
    },
  );

});
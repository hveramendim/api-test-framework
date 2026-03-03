import { describe, expect } from "vitest";
import { clients } from "../../../config/clients";
import { qaTest } from "../../../core/testing/qaTest";

import { PetStoreUserService } from "../services/petStoreUser.service";
import { PetStoreUserBuilder } from "../models/builders/user.builder";
import { assertCreateWithListContract } from "../contracts/createWithList.contract";

describe("PetStore Users API - createWithList", () => {
  const http = clients.petStore;
  const userService = new PetStoreUserService(http);

  qaTest(
    "Caso 01 - Crear lista con multiples usuarios",
    {
      tags: ["@Caso-01"],
      risk: "LOW",
      endpointKey: "POST /user/createWithList",
      domain: "pet_store",
    },
    async () => {
      const body = PetStoreUserBuilder.many(2);
      //console.log("REQUEST:" + JSON.stringify(body))
      const res = await userService.createWithList(body);
      //console.log("REQUEST:" + JSON.stringify(res))
      expect(res.status).toBe(200);
      assertCreateWithListContract(res.data);

      expect(res.data.code).toBe(200);
      expect(res.data.message.toLowerCase()).toBe("ok");
    },
  );

qaTest(
    "Caso 02 - Crear lista con 1 usuario",
    {
      tags: ["@Caso-02"],
      risk: "LOW",
      endpointKey: "POST /user/createWithList",
      domain: "pet_store",
    },
    async () => {
      const body = PetStoreUserBuilder.many(1);
      //console.log("REQUEST:" + JSON.stringify(body))
      const res = await userService.createWithList(body);
      //console.log("REQUEST:" + JSON.stringify(res))
      expect(res.status).toBe(200);
      assertCreateWithListContract(res.data);

      expect(res.data.code).toBe(200);
      expect(res.data.message.toLowerCase()).toBe("ok");
    },
  );
  qaTest(
    "Caso 03 - crear lista con datos vacios",
    {
      tags: ["@Caso-03"],
      risk: "LOW",
      endpointKey: "POST /user/createWithList",
      domain: "pet_store",
    },
    async () => {
      const body: any[] = [];
      const res = await userService.createWithArray(body);
      expect(res.status).toBe(200);
      assertCreateWithListContract(res.data);
      expect(res.data.code).toBe(200);
    },
  );

  qaTest(
  "Caso 04 - crear lista con estructura invalida (objeto en vez de array)",
  {
    tags: ["@Caso-04"],
    risk: "MEDIUM",
    endpointKey: "POST /user/createWithList",
    domain: "pet_store",
  },
  async () => {
    const body = {
      id: 1004,
      username: "Usuario1",
    }; // debería ser un array

    const res = await userService.createWithArray(body as any);

    expect(res.status).toBe(500);
    expect(res.data.code).toBe(500);
  }
);

qaTest(
  "Caso 05 - Usuario con id invalido (string)",
  {
    tags: ["@Caso-05"],
    risk: "LOW",
    endpointKey: "POST /user/createWithList",
    domain: "pet_store",
  },
  async () => {
    const body = [
      {
        id: "ID_Invalido", // debería ser number
        username: "Test4",
        firstName: "Jose",
        lastName: "Suarez",
        email: "jose@test.com",
        password: "Pass1234",
        phone: "444444444",
        userStatus: 1,
      },
    ];

    const res = await userService.createWithList(body);

    expect(res.status).toBe(500); 
  },
);

qaTest(
  "Caso 06 - Usuario duplicado en lista (mismo username)",
  {
    tags: ["@Caso-06"],
    risk: "MEDIUM",
    endpointKey: "POST /user/createWithList",
    domain: "pet_store",
  },
  async () => {
    const body = [
      {
        id: 1006,
        username: "user_list_006", // primer usuario
        firstName: "Juan",
        lastName: "Perez",
        email: "juan@test.com",
        password: "Pass1234",
        phone: "111111111",
        userStatus: 1,
      },
      {
        id: 1007,
        username: "user_list_006", // duplicado
        firstName: "Maria",
        lastName: "Gomez",
        email: "maria@test.com",
        password: "Pass5678",
        phone: "222222222",
        userStatus: 0,
      },
    ];

    const res = await userService.createWithList(body);

    // EL API debería indicar error (400) ya que debe ser un campo unico.
    // Pero para el Test se crea ambos
    expect(res.status).toBe(200);

    // Registrar comportamiento real
    console.log("Usuarios enviados:", JSON.stringify(body));
    console.log("Código devuelto:", res.data.code);
  },
);

});
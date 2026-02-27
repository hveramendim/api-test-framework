import { describe, expect, beforeAll } from "vitest";
import { PlaygroundUserService } from "../services/playgroundUsers.service";
import { clients } from "../../../config/clients";
import { qaTest } from "../../../core/testing/qaTest";
import { assertProductsListContract, assertSupportContract } from "../contracts/product.contract";

describe("Playground Users API", () => {
  const http = clients.playground;
  const usersService = new PlaygroundUserService(http);
  beforeAll(async () => {
    clients.playground.setAuthToken("reqres_e6fe68be4fe5446dbe0fae0d5884862d");
  });

  qaTest(
    "Validar listado de productos",
    {
      tags: ["@TC-001"],
      risk: "HIGH",
      endpointKey: "GET / products",
      domain: "reqres.in",
    },
    async () => {
      const res = await usersService.getProducts();
      expect(res.status).toBe(200);
      assertProductsListContract(res.data);
      expect(res.data.data.length).toBeGreaterThan(0);
    },
  );

  qaTest(
    "Validar información de support en lista de productos",
    {
      tags: ["@TC-002"],
      risk: "LOW",
      endpointKey: "GET / products",
      domain: "reqres.in",
    },
    async () => {
      const res = await usersService.getProducts();
      expect(res.status).toBe(200);
      assertSupportContract(res.data.support);
      expect(res.data.data.length).toBeGreaterThan(0);
    },
  );

});

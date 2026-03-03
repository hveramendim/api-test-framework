// src/domains/pet_store/tests/users.get.test.ts

import { describe, expect, beforeAll } from "vitest";
import { PetStoreUserService } from "../services/petStoreUser.service";
import { PetStoreUserBuilder } from "../models/builders/user.builder";
import { clients } from "../../../config/clients";
import { qaTest } from "../../../core/testing/qaTest";
import { assertLoginUserContract } from "../contracts/loginUser.contract";
import { LoginUserRequest } from "../models/loginUser.request.model";

describe("Pet Store Users API - Login User", () => {
    const http = clients.petStore; // Para GET
    const petStoreUserService = new PetStoreUserService(http); // Para crear usuarios

    beforeAll(async () => {
        // Crear usuario 'user1' antes de los tests GET
        const user = PetStoreUserBuilder.valid({ username: "testi1", password: "testi1" });
        await petStoreUserService.createWithArray([user]);
    });

    qaTest(
        "LU-HP-01 - Login de usuario existente",
        {
            tags: ["@LU-HP-01"],
            risk: "HIGH",
            endpointKey: "GET /user/login",
            domain: "pet_store",
        },
        async () => {
            const user = { username: "testi1", password: "testi1" } as LoginUserRequest;
            const res = await petStoreUserService.loginUser(user);
            expect(res.status).toBe(200);
            expect(res.data.code).toBe(res.status);
            assertLoginUserContract(res.data);

            // Pending to assert headers contract when it's implemented in the service
            const headers = res.headers;
            console.log(headers);
            expect(headers).toHaveProperty("x-rate-limit");
            expect(headers).toHaveProperty("x-expires-after");

            expect(typeof headers["x-expires-after"]).toBe("string");
            expect(typeof headers["x-rate-limit"]).toBe("string");

            expect(Number(headers["x-rate-limit"])).toBeGreaterThanOrEqual(0);
            expect(headers["x-expires-after"].length).toBeGreaterThan(0);
        }
    );

    qaTest(
        "LU-UHP-01 - Login de usuario no existente",
        {
            tags: ["@LU-UHP-01"],
            risk: "HIGH",
            endpointKey: "GET /user/login",
            domain: "pet_store",
        },
        async () => {
            const user = { username: "testi3", password: "testi3" } as LoginUserRequest;
            const res = await petStoreUserService.loginUser(user);
            expect(res.status).toBe(404);
            expect(res.data.code).toBe(res.status);
            assertLoginUserContract(res.data);
        }
    );

    qaTest(
        "LU-NEG-01 - Login de usuario con campos requeridos vacíos",
        {
            tags: ["@LU-NEG-01"],
            risk: "HIGH",
            endpointKey: "GET /user/login",
            domain: "pet_store",
        },
        async () => {
            const user = { username: "", password: "" } as LoginUserRequest;
            const res = await petStoreUserService.loginUser(user);
            expect(res.status).toBe(404);
            expect(res.data.code).toBe(res.status);
            assertLoginUserContract(res.data);
        }
    );

    qaTest(
        "LU-NEG-02 - Login de usuario con campo username vacío",
        {
            tags: ["@LU-NEG-02"],
            risk: "HIGH",
            endpointKey: "GET /user/login",
            domain: "pet_store",
        },
        async () => {
            const user = { username: "", password: "testi2" } as LoginUserRequest;
            const res = await petStoreUserService.loginUser(user);
            expect(res.status).toBe(404);
            expect(res.data.code).toBe(res.status);
            assertLoginUserContract(res.data);
        }
    );

    qaTest(
        "LU-NEG-03 - Login de usuario con campo password vacío",
        {
            tags: ["@LU-NEG-03"],
            risk: "HIGH",
            endpointKey: "GET /user/login",
            domain: "pet_store",
        },
        async () => {
            const user = { username: "testi2", password: "" } as LoginUserRequest;
            const res = await petStoreUserService.loginUser(user);
            expect(res.status).toBe(404);
            expect(res.data.code).toBe(res.status);
            assertLoginUserContract(res.data);
        }
    );
});
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
        const user = PetStoreUserBuilder.valid({ username: "user1", password: "1234" });
        await petStoreUserService.createWithArray([user]);
    });

    qaTest(
        "LU-HP-01 - Login de usuario existente",
        {
            tags: ["@LU-HP-01"],
            risk: "LOW",
            endpointKey: "GET /user/login",
            domain: "pet_store",
        },
        async () => {
            const user = { username: "user1", password: "1234" } as LoginUserRequest;
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
            risk: "LOW",
            endpointKey: "GET /user/login",
            domain: "pet_store",
        },
        async () => {
            const user = { username: "user2", password: "1234" } as LoginUserRequest;
            const res = await petStoreUserService.loginUser(user);
            expect(res.status).toBe(404);
            expect(res.data.code).toBe(res.status);
        }
    );
});
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
        "LU-HP-01 - Loguearse exitosamente con usuario creado",
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
        }
    );
});
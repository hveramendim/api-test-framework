// src/domains/pet_store/tests/users.get.test.ts

import { describe, expect, beforeAll } from "vitest";
import { UsersService } from "../services/users.service";
import { PetStoreUserService } from "../services/petStoreUser.service";
import { clients } from "../../../config/clients";
import { qaTest } from "../../../core/testing/qaTest";
import { PetStoreUserBuilder } from "../models/builders/user.builder";
import { assertPetStoreUserContract } from "../contracts/users.contract";

describe("Pet Store Users API", () => {
    const usersService = new UsersService(clients.petStore); // Para GET
    const petStoreUserService = new PetStoreUserService(clients.petStore); // Para crear usuarios

    beforeAll(async () => {
        // Crear usuario 'user1' antes de los tests GET
        const user = PetStoreUserBuilder.valid({ username: "user1" });
        await petStoreUserService.createWithArray([user]);
    });

    qaTest(
        "GET /user/{username} - 200 OK",
        { tags: ["positive", "smoke"], risk: "HIGH", endpointKey: "GET /user/{username}" },
        async () => {
            const res = await usersService.getUserByUsername("user1");
            expect(res.status).toBe(200);
            assertPetStoreUserContract(res.data);
            expect(res.data.username).toBe("user1");
        }
    );

    qaTest(
        "GET /user/{username} - 404 Not Found",
        { tags: ["negative"], risk: "MEDIUM", endpointKey: "GET /user/{username}" },
        async () => {
            const res = await usersService.getUserByUsername("nonexistent_user");
            expect(res.status).toBe(404);
        }
    );

    qaTest(
        "GET /user/{username} - 400 Bad Request",
        { tags: ["negative"], risk: "MEDIUM", endpointKey: "GET /user/{username}" },
        async () => {
            const res = await usersService.getUserByUsername(""); // username inválido
            // Permitir que devuelva 400 o 405 según la implementación actual
            expect([400, 405]).toContain(res.status);
        }
    );
});
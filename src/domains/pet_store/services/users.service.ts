// src/domains/pet_store/services/users.service.ts

import type { HttpClient } from "../../../core/http/httpClient";
import type { HttpRequestOptions } from "../../../core/http/httpTypes";
import { clients } from "../../../config/clients";
import type { PetStoreUser } from "../models/users.types";

export class UsersService {
  constructor(private readonly http: HttpClient = clients.petStore) {}

  // GET /user/{username}
  getUserByUsername(username: string, opts?: HttpRequestOptions) {
    return this.http.get<PetStoreUser>(`/user/${username}`, opts);
  }
}
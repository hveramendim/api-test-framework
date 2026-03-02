import type { HttpClient } from "../../../core/http/httpClient";
import type { HttpRequestOptions } from "../../../core/http/httpTypes";
import { clients } from "../../../config/clients";

import type { CreateWithArrayRequest } from "../models/createWithArray.request.model";
import type { CreateWithArrayResponse } from "../models/createWithArray.response.model";
import type { PetStoreApiResponse } from "../models/shared/api-response.model";
import { LoginUserRequest } from "../models/loginUser.request.model";
import { LoginUserResponse } from "../models/loginUser.response.model";

export class PetStoreUserService {
  constructor(private readonly http: HttpClient = clients.petStore) {}


  createWithArray( users: CreateWithArrayRequest, opts?: HttpRequestOptions) {
    return this.http.post<CreateWithArrayResponse>(`/user/createWithArray`, users,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        ...opts,
      }
    );
  }

  deleteUser( username: string, opts?: HttpRequestOptions) {
    return this.http.delete<PetStoreApiResponse>(`/user/${username}`, opts);
  }
  
  loginUser(credentials: LoginUserRequest, opts?: HttpRequestOptions) {
    return this.http.get<LoginUserResponse>(`/user/login`, {
      params: credentials as Record<string, any>,
      ...opts,
    });
  }
}
import type { HttpClient } from "../../../core/http/httpClient";
import type { HttpRequestOptions } from "../../../core/http/httpTypes";
import { clients } from "../../../config/clients";

import type { CreateWithArrayRequest } from "../models/createWithArray.request.model";
import type { CreateWithArrayResponse } from "../models/createWithArray.response.model";
import type { PetStoreApiResponse } from "../models/shared/api-response.model";

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

  createWithList( users: CreateWithArrayRequest, opts?: HttpRequestOptions) {
    return this.http.post<CreateWithArrayResponse>(`/user/createWithList`, users,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        ...opts,
      }
    );
  }
  
}
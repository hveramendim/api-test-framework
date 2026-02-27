import type { ReqResUsersResponse } from "../models/reqresUsers.model";
import type { ReqResResourcesResponse } from "../models/reqresResources.model";
import type { HttpClient } from "../../../core/http/httpClient";
import { clients } from "../../../config/clients";
import type { HttpRequestOptions } from "../../../core/http/httpTypes";
import { ReqProductsResponse } from "../models/reqresProducts.model";


export class PlaygroundUserService {
  constructor(private readonly http: HttpClient = clients.playground) {}

  getUsers(opts?: HttpRequestOptions) {
    return this.http.get<ReqResUsersResponse>(`/users`, opts);
  }
  getResources(opts?: HttpRequestOptions) {
    return this.http.get<ReqResResourcesResponse>(`/unknown`, opts);
  }
  getUser(id: string, opts?: HttpRequestOptions) {
    return this.http.get(`/users/${id}`, opts);
  }

  getProducts(opts?: HttpRequestOptions) {
    return this.http.get<ReqProductsResponse>(`/products`, opts);
  }

}

import type { HttpClient } from "../core/http/httpClient";
import { clients } from "../config/clients";

type LoginResponse = { token: string };

export class AuthService {
  constructor(private readonly http: HttpClient = clients.playground) {}

  login(email: string, password: string) {
    return this.http.post<LoginResponse>("/login", { email, password });
  }
}

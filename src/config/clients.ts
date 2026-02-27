import { env } from "./env";
import { HttpClient } from "../core/http/httpClient";

export const clients = {
  health: new HttpClient(env.baseUrlHealth),
  playground: new HttpClient(env.baseUrlPlayground),
  login: new HttpClient(env.baseUrlLogin),
  petStore: new HttpClient(env.petStore),
};

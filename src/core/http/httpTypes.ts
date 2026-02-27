// Tipos comunes para requests HTTP
export type HttpRequestOptions = {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
};

// Respuesta estándar del framework (independiente de Axios)
export type HttpResponse<T> = {
  status: number;
  data: T;
  headers: Record<string, string>;
};

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const env = {
  name: process.env.ENV ?? "qa",
  timeoutMs: Number(process.env.DEFAULT_TIMEOUT_MS ?? "15000"),
  baseUrlHealth: required("HEALTH_BASE_URL"),
  baseUrlPlayground: required("PLAYGROUND_BASE_URL"),
  playgroundApiKey: required("PLAYGROUND_API_KEY"),
  baseUrlLogin: required("LOGIN_BASE_URL"),
  petStore: required("PET_STORE_BASE_URL"),
};

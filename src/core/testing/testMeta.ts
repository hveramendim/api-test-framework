export type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

export type TestMeta = {
  tags: string[];           // ["smoke","negative","contract"]
  risk: RiskLevel;               // "high"
  endpointKey: string;      // "GET /users/{id}"
  domain?: string;          // "playground_users"
};

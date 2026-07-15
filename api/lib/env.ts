import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

function optional(name: string, defaultValue = ""): string {
  return process.env[name] ?? defaultValue;
}

export const env = {
  appId: optional("APP_ID"),
  appSecret: optional("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  kimiAuthUrl: optional("KIMI_AUTH_URL"),
  kimiOpenUrl: required("KIMI_OPEN_URL"),
  ownerUnionId: optional("OWNER_UNION_ID"),
  kimiApiKey: optional("KIMI_API_KEY"),
  iftttWebhookKey: optional("IFTTT_WEBHOOK_KEY", "cwiD1tRy3wGlwvaY8opdv-"),
};

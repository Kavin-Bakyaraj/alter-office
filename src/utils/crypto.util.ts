import crypto from "crypto";

export function generateApiKey(size: number = 32): string {
  return crypto.randomBytes(size).toString("hex");
}

export function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

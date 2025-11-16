import { FastifyRequest, FastifyReply } from "fastify";
import { AuthService } from "./auth.service";

const service = new AuthService();

export async function apiKeyMiddleware(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || typeof apiKey !== "string") {
    return reply.status(401).send({ error: "Missing API key" });
  }

  const appId = await service.validateApiKey(apiKey);

  if (!appId) {
    return reply.status(403).send({ error: "Invalid or expired API key" });
  }

  (req as any).appId = appId;
}

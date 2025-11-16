import { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "./auth.service";

const service = new AuthService();

export class AuthController {
  async register(req: FastifyRequest, reply: FastifyReply) {
    const payload = (req.body as any) || {};
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    const ownerEmail = typeof payload.ownerEmail === "string" ? payload.ownerEmail.trim() : "";

    if (!name || !ownerEmail) {
      return reply.status(400).send({ error: "Missing required fields: name and ownerEmail" });
    }

    try {
      const result = await service.registerApp(name, ownerEmail);
      return reply.send(result);
    } catch (err: any) {
      req.log?.error?.(err);
      return reply.status(500).send({ error: err?.message || "Internal Server Error" });
    }
  }

  async revoke(req: FastifyRequest, reply: FastifyReply) {
    const payload = (req.body as any) || {};
    const appId = typeof payload.appId === "string" ? payload.appId : "";

    if (!appId) return reply.status(400).send({ error: "Missing appId" });

    try {
      const result = await service.revokeKey(appId);
      reply.send(result);
    } catch (err: any) {
      req.log?.error?.(err);
      reply.status(500).send({ error: err?.message || "Internal Server Error" });
    }
  }

  async generate(req: FastifyRequest, reply: FastifyReply) {
    const payload = (req.body as any) || {};
    const appId = typeof payload.appId === "string" ? payload.appId : "";

    if (!appId) return reply.status(400).send({ error: "Missing appId" });

    try {
      const result = await service.regenerateKey(appId);
      reply.send(result);
    } catch (err: any) {
      req.log?.error?.(err);
      reply.status(500).send({ error: err?.message || "Internal Server Error" });
    }
  }
}

import { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "./auth.service";

const service = new AuthService();

export class AuthController {
  async register(req: FastifyRequest, reply: FastifyReply) {
    const { name, ownerEmail } = req.body as any;
    const result = await service.registerApp(name, ownerEmail);
    reply.send(result);
  }

  async revoke(req: FastifyRequest, reply: FastifyReply) {
    const { appId } = req.body as any;
    const result = await service.revokeKey(appId);
    reply.send(result);
  }

  async generate(req: FastifyRequest, reply: FastifyReply) {
    const { appId } = req.body as any;
    const result = await service.regenerateKey(appId);
    reply.send(result);
  }
}

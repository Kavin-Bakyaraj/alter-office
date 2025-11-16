import { FastifyInstance } from "fastify";
import { AuthController } from "./auth.controller";

const controller = new AuthController();

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/api/auth/register", controller.register);
  fastify.post("/api/auth/revoke", controller.revoke);
  fastify.post("/api/auth/regenerate", controller.generate);
}

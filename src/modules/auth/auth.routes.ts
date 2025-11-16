import { FastifyInstance } from "fastify";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

const controller = new AuthController();
const authService = new AuthService();

export async function authRoutes(fastify: FastifyInstance) {
  // POST routes (existing)
  fastify.post("/api/auth/register", controller.register);
  fastify.post("/api/auth/revoke", controller.revoke);
  fastify.post("/api/auth/regenerate", controller.generate);

  // GET /api/auth/api-key?appId=...
  fastify.get(
    "/api/auth/api-key",
    {
      schema: {
        tags: ["Auth"],
        querystring: {
          type: "object",
          required: ["appId"],
          properties: {
            appId: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              apiKeyHash: { type: "string" },
              appId: { type: "string" },
            },
          },
          400: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          404: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const { appId } = req.query as any;
      if (!appId) {
        return reply.status(400).send({ error: "Missing appId query parameter" });
      }
      try {
        const apiKeyHash = await authService.getApiKey(appId);
        return reply.send({ apiKeyHash, appId });
      } catch (err: any) {
        return reply.status(404).send({ error: err.message || "Not found" });
      }
    }
  );
}

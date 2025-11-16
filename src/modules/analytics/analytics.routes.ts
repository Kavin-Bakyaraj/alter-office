import { FastifyInstance } from "fastify";
import { AnalyticsController } from "./analytics.controller";
import { apiKeyMiddleware } from "../auth/apiKey.middleware";

const controller = new AnalyticsController();

export async function analyticsRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/api/analytics/collect",
    {
      preHandler: [
        apiKeyMiddleware,
        fastify.rateLimit({
          max: Number(process.env.RATE_LIMIT_REQUESTS || 500),
          timeWindow: Number(process.env.RATE_LIMIT_WINDOW || 60) * 1000,
        }),
      ],
    },
    controller.collect
  );

  fastify.get(
    "/api/analytics/event-summary",
    {
      preHandler: apiKeyMiddleware,
    },
    controller.summary
  );

  fastify.get(
    "/api/analytics/user-stats",
    {
      preHandler: apiKeyMiddleware,
    },
    controller.userStats
  );
}

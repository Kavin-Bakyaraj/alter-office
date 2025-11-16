import { FastifyInstance } from "fastify";
import { AnalyticsController } from "./analytics.controller";
import { apiKeyMiddleware } from "../auth/apiKey.middleware";

const controller = new AnalyticsController();

export async function analyticsRoutes(fastify: FastifyInstance) {
  // Collect event — authenticate via API key middleware
  fastify.post(
    "/api/analytics/collect",
    {
      preHandler: [apiKeyMiddleware],
      config: {
        rateLimit: {
          max: 100,
          timeWindow: '1 minute'
        }
      },
      schema: {
        tags: ["Analytics"],
        body: {
          type: "object",
          required: ["event"],
          properties: {
            event: { type: "string" },
            url: { type: "string" },
            referrer: { type: "string" },
            device: { type: "string" },
            ipAddress: { type: "string" },
            timestamp: { type: "string" },
            userId: { type: "string" },
            metadata: { type: "object" }
          }
        }
      }
    },
    controller.collect
  );

  // Event summary
  fastify.get(
    "/api/analytics/event-summary",
    {
      preHandler: apiKeyMiddleware,
      schema: {
        tags: ["Analytics"],
        querystring: {
          type: "object",
          properties: {
            event: { type: "string" },
            startDate: { type: "string" },
            endDate: { type: "string" },
            app_id: { type: "string" }
          },
          required: ["event"]
        }
      }
    },
    controller.summary
  );

  // User stats
  fastify.get(
    "/api/analytics/user-stats",
    {
      preHandler: apiKeyMiddleware,
      schema: {
        tags: ["Analytics"],
        querystring: {
          type: "object",
          properties: {
            userId: { type: "string" }
          },
          required: ["userId"]
        }
      }
    },
    controller.userStats
  );
}

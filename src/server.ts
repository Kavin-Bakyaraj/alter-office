import Fastify from "fastify";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import rateLimit from "@fastify/rate-limit";

import { prisma } from "./utils/prisma";
import { redis } from "./utils/redis";

import { authRoutes } from "./modules/auth/auth.routes";
import { analyticsRoutes } from "./modules/analytics/analytics.routes";

// Initialize Fastify with proper logger config
const fastify = Fastify({
  logger:
    process.env.NODE_ENV !== "production"
      ? {
          transport: {
            target: "pino-pretty",
            options: { colorize: true },
          },
        }
      : true,
});

async function main() {
  await fastify.register(helmet);
  await fastify.register(cors, { origin: true });

  await fastify.register(rateLimit, {
    global: false,
  });

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: "Website Analytics API",
        version: "1.0.0",
        description: "Scalable analytics backend for websites and mobile apps",
      },
      tags: [
        { name: "Auth", description: "API Key Management Endpoints" },
        { name: "Analytics", description: "Event Collection and Reporting" },
      ],
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: "apiKey",
            in: "header",
            name: "x-api-key",
          },
        },
      },
    },
  });

  await fastify.register(swaggerUI, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
  });

  await fastify.register(authRoutes);
  await fastify.register(analyticsRoutes);

  fastify.get("/", async () => {
    return {
      message: "Analytics API Running",
      environment: process.env.NODE_ENV || "development",
    };
  });

  fastify.get("/health", async (_req, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      await redis.ping();
      return { status: "ok" };
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ status: "error" });
    }
  });

  const port = Number(process.env.PORT) || 4000;

  try {
    await fastify.listen({ port, host: "0.0.0.0" });
    fastify.log.info(`Server running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();

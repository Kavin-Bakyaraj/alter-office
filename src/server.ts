import Fastify, { FastifyInstance } from "fastify";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import rateLimit from "@fastify/rate-limit";

import { prisma } from "./utils/prisma";
import { redis } from "./utils/redis";

import { authRoutes } from "./modules/auth/auth.routes";
import { analyticsRoutes } from "./modules/analytics/analytics.routes";

/**
 * Diagnostic Fastify server builder.
 * - Adds a small onRequest hook (non-production) that logs routeOptions
 *   and inspects preHandler / preParsing arrays to report any invalid entries.
 *
 * This file is temporary — after we capture the failing route info you can
 * revert to the earlier server.ts. It does not change your app logic.
 */

function createFastifyInstance(): FastifyInstance {
  return Fastify({
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
}

export async function buildServer(): Promise<FastifyInstance> {
  const fastify = createFastifyInstance();

  // Core security and plugins
  await fastify.register(helmet);
  await fastify.register(cors, { origin: true });

  // Rate Limiting (not global; plugin registered with global: false)
  await fastify.register(rateLimit, {
    global: false,
  });

  // Swagger / OpenAPI setup
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: "Website Analytics API",
        version: "1.0.0",
        description: "Scalable analytics backend for websites and mobile apps",
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

  // Register application routes
  await fastify.register(authRoutes);
  await fastify.register(analyticsRoutes);

  // Optionally register shortUrl routes if the module exists.
  try {
    // dynamic import - safe
    const maybe = await import("./modules/shorturl/shorturl.routes");
    if (maybe && maybe.shortUrlRoutes) {
      await fastify.register(maybe.shortUrlRoutes);
    }
  } catch (err) {
    fastify.log.info("Optional shortUrlRoutes not registered (module not found).");
  }

  // Base route
  fastify.get("/", async () => {
    return {
      message: "Analytics API Running",
      environment: process.env.NODE_ENV || "development",
    };
  });

  // Health-check
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

  return fastify;
}

if (require.main === module) {
  (async () => {
    const fastify = await buildServer();
    const port = Number(process.env.PORT) || 4000;
    try {
      await fastify.listen({ port, host: "0.0.0.0" });
      fastify.log.info(`Server running on port ${port}`);
    } catch (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  })();
}

import { FastifyInstance } from "fastify";
import { ShortUrlService } from "./shorturl.service";
import { apiKeyMiddleware } from "../auth/apiKey.middleware";
import { prisma } from "../../utils/prisma";

const svc = new ShortUrlService();

export async function shortUrlRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/api/shorten",
    {
      preHandler: [apiKeyMiddleware],
      schema: {
        tags: ["ShortURL"],
        body: {
          type: "object",
          required: ["originalUrl"],
          properties: { originalUrl: { type: "string" } }
        }
      }
    },
    async (req, reply) => {
      const appId = (req as any).appId;
      const { originalUrl } = req.body as any;
      const rec = await svc.createShortUrl(appId, originalUrl);
      reply.send({ shortId: rec.id, shortUrl: `${process.env.BASE_URL || ""}/r/${rec.id}` });
    }
  );

  // redirect route - public
  fastify.get("/r/:shortId", async (req, reply) => {
    const { shortId } = req.params as any;
    const rec = await svc.getById(shortId);
    if (!rec) return reply.status(404).send({ error: "Not found" });

    // record as event - do best-effort: no API key required
    try {
      await prisma.event.create({
        data: {
          appId: rec.appId,
          eventName: "shorturl_click",
          url: rec.originalUrl,
          referrer: (req.headers.referer as string) || null,
          ipAddress: req.ip || null,
          timestamp: new Date(),
          metadata: { path: req.routeOptions.url }
        }
      });
    } catch (e) {
      // swallow errors so redirect still works
      fastify.log.warn(`Failed to record shorturl click: ${e}`);
    }

    return reply.redirect(rec.originalUrl);
  });
}

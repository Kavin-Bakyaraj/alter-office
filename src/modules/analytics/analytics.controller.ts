import { FastifyReply, FastifyRequest } from "fastify";
import { AnalyticsService } from "./analytics.service";

const service = new AnalyticsService();

export class AnalyticsController {
  async collect(req: FastifyRequest, reply: FastifyReply) {
    const appId = (req as any).appId;
    const body = req.body as any;

    if (!body.event) {
      return reply.status(400).send({ error: "Missing 'event' field" });
    }

    await service.collectEvent(appId, body);
    reply.send({ status: "ok" });
  }

  async summary(req: FastifyRequest, reply: FastifyReply) {
    const appId = (req as any).appId;
    const query = req.query as any;

    if (!query.event) {
      return reply.status(400).send({ error: "Missing 'event' query param" });
    }

    const result = await service.eventSummary(query, appId);
    reply.send(result);
  }

  async userStats(req: FastifyRequest, reply: FastifyReply) {
    const appId = (req as any).appId;
    const query = req.query as any;

    if (!query.userId) {
      return reply.status(400).send({ error: "Missing userId" });
    }

    const result = await service.userStats(query, appId);
    reply.send(result);
  }
}

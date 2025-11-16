import { prisma } from "../../utils/prisma";
import { redis } from "../../utils/redis";

/**
 * Result type for raw SQL aggregation
 */
interface RawDeviceRow {
  device: string | null;
  cnt: string | number;
}

export class AnalyticsService {
  async collectEvent(appId: string, data: any) {
    const {
      event,
      url,
      referrer,
      device,
      ipAddress,
      timestamp,
      userId,
      metadata,
    } = data;

    await prisma.event.create({
      data: {
        appId,
        eventName: event,
        url,
        referrer,
        device,
        ipAddress,
        userId,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        metadata,
      },
    });

    return { success: true };
  }

  /**
   * Event summary using a raw SQL aggregation to avoid groupBy typing issues.
   */
  async eventSummary(query: any, ownerAppId: string) {
    const { event, startDate, endDate, app_id } = query;

    const cacheKey = `summary:${event}:${startDate}:${endDate}:${app_id || "all"}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // Build where clause params
    const whereClauses: string[] = [`event_name = $1`];
    const params: any[] = [event];
    let paramIndex = 2;

    // app filter
    if (app_id) {
      whereClauses.push(`app_id = $${paramIndex++}`);
      params.push(app_id);
    } else if (ownerAppId) {
      whereClauses.push(`app_id = $${paramIndex++}`);
      params.push(ownerAppId);
    }

    // date filter
    if (startDate && endDate) {
      whereClauses.push(`timestamp BETWEEN $${paramIndex++} AND $${paramIndex++}`);
      params.push(new Date(startDate));
      params.push(new Date(endDate));
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Raw SQL for device counts
    const deviceSql = `
      SELECT device, COUNT(*) AS cnt
      FROM public.events
      ${whereSql}
      GROUP BY device
    `;

    const rawRows = (await prisma.$queryRawUnsafe(deviceSql, ...params)) as RawDeviceRow[];

    // calculate total and device breakdown
    const deviceData: Record<string, number> = {};
    let total = 0;
    for (const row of rawRows) {
      const deviceKey = row.device ?? "unknown";
      const count = typeof row.cnt === "string" ? parseInt(row.cnt, 10) : Number(row.cnt);
      deviceData[deviceKey] = count;
      total += count;
    }

    // distinct ip count for unique users
    const distinctIpSql = `
      SELECT COUNT(DISTINCT ip_address) as unique_count
      FROM public.events
      ${whereSql}
    `;
    const distinctIpRow = (await prisma.$queryRawUnsafe(distinctIpSql, ...params)) as Array<{ unique_count: string | number }>;
    const uniqueUsers =
      distinctIpRow && distinctIpRow.length ? Number(distinctIpRow[0].unique_count) : 0;

    const summary = {
      event,
      count: total,
      uniqueUsers,
      deviceData,
    };

    await redis.set(cacheKey, JSON.stringify(summary), "EX", 60);

    return summary;
  }

  async userStats(query: any, ownerAppId: string) {
    const { userId } = query;

    const cacheKey = `userstats:${userId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const events = await prisma.event.findMany({
      where: {
        userId,
        appId: ownerAppId,
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    if (events.length === 0) {
      return { userId, totalEvents: 0 };
    }

    const totalEvents = events.length;
    const recent = events[0];

    // metadata is Prisma.JsonValue -> cast to object for safe access
    const metadata = (recent.metadata as unknown) as Record<string, any> | undefined;

    const response = {
      userId,
      totalEvents,
      deviceDetails: {
        browser: (metadata && metadata.browser) || "unknown",
        os: (metadata && metadata.os) || "unknown",
      },
      ipAddress: recent.ipAddress || "unknown",
    };

    await redis.set(cacheKey, JSON.stringify(response), "EX", 60);

    return response;
  }
}

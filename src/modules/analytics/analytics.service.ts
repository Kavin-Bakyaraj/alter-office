import { prisma } from "../../utils/prisma";
import { redis } from "../../utils/redis";

interface GroupByDeviceResult {
  device: string | null;
  _count: {
    device: number;
  };
}

interface IpRecord {
  ipAddress: string | null;
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

  async eventSummary(query: any, ownerAppId: string) {
    const { event, startDate, endDate, app_id } = query;

    const cacheKey = `summary:${event}:${startDate}:${endDate}:${app_id || "all"}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const conditions: any = {
      eventName: event,
    };

    if (app_id) {
      conditions.appId = app_id;
    } else {
      conditions.appId = ownerAppId;
    }

    if (startDate && endDate) {
      conditions.timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const result: GroupByDeviceResult[] = await prisma.event.groupBy({
      by: ["device"],
      where: conditions,
      _count: {
        device: true,
      },
    });

    const total = result.reduce(
      (acc: number, row: GroupByDeviceResult) => acc + row._count.device,
      0
    );

    const uniqueUsersRecords: IpRecord[] = await prisma.event
      .findMany({
        where: conditions,
        select: { ipAddress: true },
        distinct: ["ipAddress"],
      })
      .then((rows: IpRecord[]) => rows);

    const uniqueUsers = uniqueUsersRecords.length;

    const deviceData: Record<string, number> = {};
    result.forEach((row: GroupByDeviceResult) => {
      const key = row.device || "unknown";
      deviceData[key] = row._count.device;
    });

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

    const response = {
      userId,
      totalEvents,
      deviceDetails: {
        browser: recent.metadata?.browser || "unknown",
        os: recent.metadata?.os || "unknown",
      },
      ipAddress: recent.ipAddress || "unknown",
    };

    await redis.set(cacheKey, JSON.stringify(response), "EX", 60);

    return response;
  }
}

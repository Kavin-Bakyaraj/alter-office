import { prisma } from "../../utils/prisma";
import { redis } from "../../utils/redis";
import { generateApiKey, hashApiKey } from "../../utils/crypto.util";

export class AuthService {
  async registerApp(name: string, ownerEmail: string) {
    const apiKey = generateApiKey(Number(process.env.API_KEY_BYTE_SIZE) || 32);
    const hashed = hashApiKey(apiKey);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(process.env.API_KEY_TTL_DAYS || 365));

    const app = await prisma.app.create({
      data: {
        name,
        ownerEmail,
        apiKeyHash: hashed,
        expiresAt,
      },
    });

    // Cache hashed -> appId
    await redis.set(`api_key:${hashed}`, app.id, "EX", 60 * 60 * 24);

    return { apiKey, appId: app.id };
  }

  async getApiKey(appId: string) {
    const app = await prisma.app.findUnique({
      where: { id: appId },
    });

    if (!app || (app as any).revoked) {
      throw new Error("App not found or revoked");
    }

    return (app as any).apiKeyHash;
  }

  async revokeKey(appId: string) {
    await prisma.app.update({
      where: { id: appId },
      data: {
        revoked: true,
      } as any,
    });

    return { revoked: true };
  }

  async regenerateKey(appId: string) {
    const newKey = generateApiKey(Number(process.env.API_KEY_BYTE_SIZE) || 32);
    const hashed = hashApiKey(newKey);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(process.env.API_KEY_TTL_DAYS || 365));

    await prisma.app.update({
      where: { id: appId },
      data: {
        apiKeyHash: hashed,
        expiresAt,
        revoked: false,
      } as any,
    });

    await redis.set(`api_key:${hashed}`, appId, "EX", 60 * 60 * 24);

    return { apiKey: newKey };
  }

  async validateApiKey(apiKey: string) {
    const hashed = hashApiKey(apiKey);

    const cached = await redis.get(`api_key:${hashed}`);
    if (cached) return cached;

    const app = await prisma.app.findFirst({
      where: {
        apiKeyHash: hashed,
        revoked: false,
        expiresAt: {
          gt: new Date(),
        },
      } as any,
    });

    if (!app) return null;

    await redis.set(`api_key:${hashed}`, app.id, "EX", 60 * 60 * 24);

    return app.id;
  }
}

import { prisma } from "../../utils/prisma";
import { nanoid } from "nanoid";

/**
 * ShortUrlService (raw SQL) — uses prisma.$queryRawUnsafe so we don't require
 * a generated prisma.shortUrl type. This keeps the code working immediately
 * without running Prisma migrations / client generation.
 *
 * NOTE: This returns plain objects (untyped). For a typed client use a Prisma
 * model and run `npx prisma generate` after migration.
 */

export class ShortUrlService {
  /**
   * Create a short URL record and return the inserted row.
   */
  async createShortUrl(appId: string, originalUrl: string) {
    const shortId = nanoid(8);

    const insertSql = `
      INSERT INTO public.short_urls (id, app_id, original_url, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, app_id, original_url, created_at
    `;

    const rows = (await prisma.$queryRawUnsafe(insertSql, shortId, appId, originalUrl)) as any[];
    return rows && rows.length ? rows[0] : null;
  }

  /**
   * Fetch a short URL row by id.
   */
  async getById(shortId: string) {
    const selectSql = `
      SELECT id, app_id, original_url, created_at
      FROM public.short_urls
      WHERE id = $1
      LIMIT 1
    `;

    const rows = (await prisma.$queryRawUnsafe(selectSql, shortId)) as any[];
    return rows && rows.length ? rows[0] : null;
  }
}

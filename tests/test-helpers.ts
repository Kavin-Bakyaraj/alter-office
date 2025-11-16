// tests/test-helpers.ts
import { prisma } from "../src/utils/prisma";

/**
 * Utility to delete an app and its events by appId.
 * Uses deleteMany to avoid errors if the row doesn't exist.
 */
export async function cleanupApp(appId: string) {
  if (!appId) return;
  try {
    await prisma.event.deleteMany({ where: { appId } });
    await prisma.app.deleteMany({ where: { id: appId } });
  } catch (err) {
    // swallow errors for cleanup safety
    // console.warn("cleanupApp error", err);
  }
}

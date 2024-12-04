import 'server-only';

// import { db } from '@/db';
// import { userUsage } from '@/db/schema';
// import { eq, sql } from 'drizzle-orm';
import prisma from '../prisma';

export async function trackStorageChange(userId: string, bytesChange: number) {
  // await db.update(userUsage)
  //   .set({ 
  //     storageUsedBytes: sql`${userUsage.storageUsedBytes} + ${bytesChange}`,
  //     lastUpdated: new Date()
  //   })
  //   .where(eq(userUsage.userId, userId));

  await prisma.userUsage.updateMany({
    data: {
      storageUsedBytes: {
        increment: bytesChange,
      },
      lastUpdated: new Date(),
    },
    where:{
      userId: userId,
    }
  });
}

export async function trackBandwidthUsage(userId: string, bytes: number) {
  // await db.update(userUsage)
  //   .set({ 
  //     bandwidthUsedBytes: sql`${userUsage.bandwidthUsedBytes} + ${bytes}`,
  //     lastUpdated: new Date()
  //   })
  //   .where(eq(userUsage.userId, userId));

  await prisma.userUsage.updateMany({
    data: {
      bandwidthUsedBytes: {
        increment: bytes,
      }
    },
    where: {
      userId: userId,
    }
  });
}

export async function getUserUsage(userId: string): Promise<{ storageUsedBytes: number; bandwidthUsedBytes: number }> {
  // const result = await db.select({
  //   storageUsedBytes: userUsage.storageUsedBytes,
  //   bandwidthUsedBytes: userUsage.bandwidthUsedBytes
  // })
  //   .from(userUsage)
  //   .where(eq(userUsage.userId, userId))
  //   .limit(1);

  const result = await prisma.userUsage.findFirst({
    where:{
      userId: userId
    },
    select:{
      storageUsedBytes: true,
      bandwidthUsedBytes: true,
    }
  });

  return result ?? { storageUsedBytes: -1, bandwidthUsedBytes: -1 };
}
import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

/**
 * Creates a Prisma client instance for Cloudflare D1
 * @param {D1Database} d1 - The D1 database binding from Cloudflare Workers
 * @returns {PrismaClient} Prisma client instance
 */
export function createPrismaClient(d1) {
	const adapter = new PrismaD1(d1);
	return new PrismaClient({ adapter });
}

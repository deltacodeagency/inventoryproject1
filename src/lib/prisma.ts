/**
 * Browser-Safe Prisma Client Helper
 * Prevents Node.js native module bundling errors in Vite / Browser runtimes.
 */

import { createRequire } from "node:module";

const nodeRequire = createRequire(import.meta.url);
let prismaInstance: any = null;

// Only instantiate Prisma Client on Node.js / Server side
if (typeof window === "undefined") {
  try {
    const { PrismaClient } = nodeRequire("@prisma/client");

    const globalForPrisma = globalThis as unknown as {
      prisma?: any;
    };

    prismaInstance = globalForPrisma.prisma || new PrismaClient();

    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaInstance;
  } catch (err) {
    console.warn("Prisma Client unavailable in current environment:", err);
  }
}

export const prisma = prismaInstance;
export default prisma;

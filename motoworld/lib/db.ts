import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalDb = globalThis as typeof globalThis & { prisma?: PrismaClient };
export const db = globalDb.prisma ?? new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL || "postgresql://127.0.0.1:5432/motoworld_unconfigured",
    max: process.env.VERCEL === "1" ? 3 : 10,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
  }),
});
if (process.env.NODE_ENV !== "production") globalDb.prisma = db;

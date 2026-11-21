
import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  if (process.env.NODE_ENV === "production") {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
      throw new Error(
        "Production requires TURSO_DATABASE_URL and TURSO_AUTH_TOKEN."
      );
    }

    const adapter = new PrismaLibSql({
      url,
      authToken,
    });

    return new PrismaClient({ adapter });
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || !connectionString.startsWith("file:")) {
    throw new Error(
      "Local development requires a SQLite DATABASE_URL."
    );
  }

  const adapter = new PrismaBetterSqlite3({
    url: connectionString,
  });

  return new PrismaClient({ adapter });
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

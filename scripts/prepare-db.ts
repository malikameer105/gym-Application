import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env if present
dotenv.config();

const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');

export function prepareDatabaseSchema() {
  const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';
  const isPostgres = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://');
  const targetProvider = isPostgres ? 'postgresql' : 'sqlite';

  if (!fs.existsSync(schemaPath)) {
    console.error(`[prepare-db] Prisma schema not found at ${schemaPath}`);
    return;
  }

  const currentContent = fs.readFileSync(schemaPath, 'utf8');
  const currentProviderMatch = currentContent.match(/provider\s*=\s*"(sqlite|postgresql)"/);
  const currentProvider = currentProviderMatch ? currentProviderMatch[1] : null;

  if (currentProvider !== targetProvider) {
    console.log(`[prepare-db] Switching Prisma provider from "${currentProvider}" to "${targetProvider}" based on DATABASE_URL.`);
    const updatedContent = currentContent.replace(
      /provider\s*=\s*"(sqlite|postgresql)"/,
      `provider = "${targetProvider}"`
    );
    fs.writeFileSync(schemaPath, updatedContent, 'utf8');
    console.log(`[prepare-db] Updated ${schemaPath} to use provider "${targetProvider}".`);
  } else {
    console.log(`[prepare-db] Prisma provider is already "${targetProvider}". No schema modification needed.`);
  }
}

prepareDatabaseSchema();

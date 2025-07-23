import { Pool, neonConfig } from '@neondatabase/serverless';
  import { drizzle } from 'drizzle-orm/neon-serverless';
  import ws from "ws";
  import * as schema from "@shared/schema";

  neonConfig.webSocketConstructor = ws;

  // For local development, use a simple DATABASE_URL
  const DATABASE_URL = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/fm_tracker";

  if (!DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  export const pool = new Pool({ connectionString: DATABASE_URL });
  export const db = drizzle({ client: pool, schema });

  console.log(`Database connected to: ${DATABASE_URL}`);
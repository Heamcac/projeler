import { eq } from 'drizzle-orm';
import { loadConfig } from './config.js';
import { connectDatabase } from './db/client.js';
import { users, categories } from './db/schema.js';
import { hashPassword } from './auth.js';

const config = loadConfig();
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !password || password.length < 16 || password.length > 128)
  throw new Error('Set ADMIN_EMAIL and a 16-128 character ADMIN_PASSWORD');
const connection = await connectDatabase(config, true);
try {
  const [existing] = await connection.db.select().from(users).where(eq(users.email, email));
  if (existing) throw new Error('Account already exists; bootstrap does not modify existing accounts');
  await connection.db.transaction(async tx => {
    await tx.insert(users).values({ email, passwordHash: await hashPassword(password), name: 'Platform Admin', role: 'admin' });
    await tx.insert(categories).values({ name: 'Giyim', slug: 'giyim' }).onConflictDoNothing();
  });
  console.log('Administrator and initial category created.');
} finally { await connection.close(); }

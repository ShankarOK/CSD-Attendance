/**
 * Script to create initial admin user
 * Run with: npx tsx lib/db/setup-admin.ts
 */

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);

async function createAdminUser(username: string, password: string): Promise<void> {
  const passwordHash = await bcrypt.hash(password, 10);
  
  await sql`
    INSERT INTO admin_users (username, password_hash)
    VALUES (${username}, ${passwordHash})
    ON CONFLICT (username) DO NOTHING
  `;
}

async function setupAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  try {
    console.log('Creating admin user...');
    await createAdminUser(username, password);
    console.log(`✓ Admin user created successfully!`);
    console.log(`  Username: ${username}`);
    console.log(`  Password: ${password}`);
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

setupAdmin();

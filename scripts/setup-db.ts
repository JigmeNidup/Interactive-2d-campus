import { config } from "dotenv";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

config({ path: ".env.local" });
config();

const c = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  bold: "\x1b[1m",
};

function step(label: string) {
  console.log(`${c.cyan}${c.bold}>${c.reset} ${label}`);
}

function ok(label: string) {
  console.log(`  ${c.green}OK${c.reset}  ${label}`);
}

function warn(label: string) {
  console.log(`  ${c.yellow}!!${c.reset}  ${label}`);
}

const SCHEMA_STATEMENTS: { label: string; sql: string }[] = [
  {
    label: "ensure pgcrypto extension (for gen_random_uuid)",
    sql: `CREATE EXTENSION IF NOT EXISTS pgcrypto`,
  },
  {
    label: "create users table",
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `,
  },
  {
    label: "create campus_maps table",
    sql: `
      CREATE TABLE IF NOT EXISTS campus_maps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        image_url VARCHAR(500) NOT NULL,
        view_box_width INTEGER DEFAULT 800,
        view_box_height INTEGER DEFAULT 600,
        is_published BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `,
  },
  {
    label: "create buildings table",
    sql: `
      CREATE TABLE IF NOT EXISTS buildings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        map_id UUID NOT NULL REFERENCES campus_maps(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        abbreviation VARCHAR(10) NOT NULL,
        category VARCHAR(50) NOT NULL CHECK (category IN ('academic','residence','dining','parking','athletics','admin','other')),
        description TEXT,
        polygon_points JSONB NOT NULL,
        center_x FLOAT NOT NULL,
        center_y FLOAT NOT NULL,
        floors INTEGER,
        departments TEXT[] DEFAULT '{}',
        color VARCHAR(7),
        sort_order INTEGER DEFAULT 0,
        locked BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `,
  },
  {
    label: "ensure buildings.locked column (idempotent migration)",
    sql: `ALTER TABLE buildings ADD COLUMN IF NOT EXISTS locked BOOLEAN NOT NULL DEFAULT false`,
  },
  {
    label: "create idx_campus_maps_user_id",
    sql: `CREATE INDEX IF NOT EXISTS idx_campus_maps_user_id ON campus_maps(user_id)`,
  },
  {
    label: "create idx_buildings_map_id",
    sql: `CREATE INDEX IF NOT EXISTS idx_buildings_map_id ON buildings(map_id)`,
  },
  {
    label: "create idx_buildings_category",
    sql: `CREATE INDEX IF NOT EXISTS idx_buildings_category ON buildings(category)`,
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(`${c.red}DATABASE_URL is not set in .env.local${c.reset}`);
    process.exit(1);
  }

  console.log(`${c.bold}Campus Map :: database setup${c.reset}\n`);
  step(`connecting to ${maskUrl(url)}`);
  const pool = new Pool({ connectionString: url });

  try {
    await pool.query("SELECT 1");
    ok("connected");

    for (const stmt of SCHEMA_STATEMENTS) {
      step(stmt.label);
      await pool.query(stmt.sql);
      ok("done");
    }

    step("seed admin user");
    const email = "admin@campusmap.com";
    const password = "admin123";
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (email, name, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [email, "Administrator", passwordHash, "admin"],
    );
    if (result.rowCount && result.rowCount > 0) {
      ok(`admin user created (${email} / ${password})`);
    } else {
      warn(`admin user already existed (${email}) - left untouched`);
    }

    console.log(`\n${c.green}${c.bold}Setup complete.${c.reset}`);
  } catch (err) {
    console.error(`\n${c.red}Setup failed:${c.reset}`, err);
    process.exitCode = 1;
  } finally {
    await pool.end();
    process.exit(process.exitCode ?? 0);
  }
}

function maskUrl(url: string): string {
  return url.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@");
}

void main();

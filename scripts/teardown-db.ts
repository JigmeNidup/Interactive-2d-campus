import { config } from "dotenv";
import { Pool } from "pg";
import readline from "node:readline/promises";

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

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(`${c.red}DATABASE_URL is not set in .env.local${c.reset}`);
    process.exit(1);
  }

  console.log(
    `${c.red}${c.bold}!! WARNING !!${c.reset} This will permanently drop the buildings, campus_maps, and users tables.\n`,
  );

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await rl.question(`Type ${c.bold}DROP${c.reset} to confirm: `);
  rl.close();

  if (answer.trim() !== "DROP") {
    console.log(`${c.yellow}Aborted.${c.reset}`);
    process.exit(0);
  }

  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();

  try {
    const tables = ["buildings", "campus_maps", "users"];
    for (const table of tables) {
      console.log(`${c.cyan}> dropping ${table}${c.reset}`);
      await client.query(`DROP TABLE IF EXISTS ${client.escapeIdentifier(table)} CASCADE`);
      console.log(`  ${c.green}OK${c.reset}`);
    }

    console.log(`\n${c.green}${c.bold}Teardown complete.${c.reset}`);
  } catch (err) {
    console.error(`\n${c.red}Teardown failed:${c.reset}`, err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
    process.exit(process.exitCode ?? 0);
  }
}

void main();

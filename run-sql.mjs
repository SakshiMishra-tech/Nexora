import pkg from "pg";
const { Client } = pkg;
import { readFileSync } from "fs";

async function run() {
  const sql = readFileSync("supabase/migrations/20260726000001_seed_marketplace_categories.sql", "utf8");
  const rlsSql = readFileSync("supabase/migrations/20260726000000_marketplace_rls.sql", "utf8");

  // Format: postgresql://postgres:gU8AiYdk3oUTh8ma@db.fzhheofzidenlclfqrim.supabase.co:5432/postgres
  const connStr = "postgresql://postgres:gU8AiYdk3oUTh8ma@db.fzhheofzidenlclfqrim.supabase.co:5432/postgres";
  
  const client = new Client({
    connectionString: connStr,
  });

  try {
    await client.connect();
    console.log("Connected to DB successfully.");

    console.log("Applying RLS migration...");
    await client.query(rlsSql);
    console.log("RLS migration applied.");

    console.log("Applying categories seed migration...");
    await client.query(sql);
    console.log("Categories seed migration applied.");

    const res = await client.query("SELECT COUNT(*) FROM marketplace_categories");
    console.log("Categories in DB:", res.rows[0].count);
    
  } catch (err) {
    console.error("Error executing SQL:", err);
  } finally {
    await client.end();
  }
}

run();

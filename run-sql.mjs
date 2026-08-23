import pkg from "pg";
const { Client } = pkg;

async function run() {
  const connStr = "postgresql://postgres:gU8AiYdk3oUTh8ma@db.fzhheofzidenlclfqrim.supabase.co:5432/postgres";
  const client = new Client({ connectionString: connStr });

  try {
    await client.connect();
    
    // First, let's apply the recent migration
    console.log("Applying lost_found_contact_update migration...");
    const migrationSql = `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='phone') THEN
          ALTER TABLE public.profiles ADD COLUMN phone TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='whatsapp') THEN
          ALTER TABLE public.profiles ADD COLUMN whatsapp TEXT;
        END IF;
      END $$;
    `;
    await client.query(migrationSql);
    console.log("Migration applied successfully.");

    console.log("Fetching lost_found_items schema:");
    const res = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'lost_found_items';
    `);
    console.table(res.rows);
  } catch (err) {
    console.error("Error executing SQL:", err);
  } finally {
    await client.end();
  }
}

run();

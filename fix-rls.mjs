import pkg from "pg";
const { Client } = pkg;

async function run() {
  const connStr = "postgresql://postgres:gU8AiYdk3oUTh8ma@db.fzhheofzidenlclfqrim.supabase.co:5432/postgres";
  const client = new Client({ connectionString: connStr });

  try {
    await client.connect();
    
    const query = `
      ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
      DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
      DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;

      CREATE POLICY "Users can insert their own settings"
      ON public.user_settings FOR INSERT
      WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can update their own settings"
      ON public.user_settings FOR UPDATE
      USING (auth.uid() = user_id);

      CREATE POLICY "Users can view their own settings"
      ON public.user_settings FOR SELECT
      USING (auth.uid() = user_id);
    `;
    
    await client.query(query);
    console.log("RLS policies added successfully.");
  } catch (err) {
    console.error("Error executing SQL:", err);
  } finally {
    await client.end();
  }
}

run();

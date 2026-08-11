import pkg from "pg";

const { Client } = pkg;

const connectionString =
  process.env.SUPABASE_DB_URL ||
  "postgresql://postgres:gU8AiYdk3oUTh8ma@db.fzhheofzidenlclfqrim.supabase.co:5432/postgres";

const publicTables = [
  "marketplace_messages",
  "marketplace_chats",
  "marketplace_reports",
  "saved_items",
  "marketplace_images",
  "marketplace_items",
  "marketplace_categories",
];

async function tableExists(client, schema, table) {
  const { rows } = await client.query("select to_regclass($1) as name", [
    `${schema}.${table}`,
  ]);
  return Boolean(rows[0]?.name);
}

async function deleteFromTable(client, schema, table) {
  if (!(await tableExists(client, schema, table))) {
    console.log(`skip ${schema}.${table}: table not found`);
    return;
  }

  const result = await client.query(`delete from ${schema}.${table}`);
  console.log(`deleted ${result.rowCount} row(s) from ${schema}.${table}`);
}

async function run() {
  const client = new Client({ connectionString });

  await client.connect();
  try {
    await client.query("begin");

    if (await tableExists(client, "storage", "objects")) {
      const storage = await client.query(
        "delete from storage.objects where bucket_id = $1",
        ["marketplace-images"],
      );
      console.log(
        `deleted ${storage.rowCount} marketplace storage object(s)`,
      );
    }

    for (const table of publicTables) {
      await deleteFromTable(client, "public", table);
    }

    await client.query("commit");
    console.log("marketplace data is now clean");
  } catch (error) {
    await client.query("rollback");
    console.error("cleanup failed:", error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();

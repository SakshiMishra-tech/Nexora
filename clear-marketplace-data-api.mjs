import { createClient } from "@supabase/supabase-js";

const url =
  process.env.VITE_SUPABASE_URL ||
  "https://fzhheofzidenlclfqrim.supabase.co";
const anonKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6aGhlb2Z6aWRlbmxjbGZxcmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1ODQ1OTQsImV4cCI6MjA5ODE2MDU5NH0.epEoJq8PHBW6UMzTEreo8_8Ty-PX-kxIGEShWwK2lms";

const supabase = createClient(url, anonKey);
const nilUuid = "00000000-0000-0000-0000-000000000000";

const tableDeletes = [
  { table: "marketplace_messages", column: "id" },
  { table: "marketplace_chats", column: "id" },
  { table: "marketplace_reports", column: "id" },
  { table: "saved_items", column: "item_id" },
  { table: "marketplace_images", column: "id" },
  { table: "marketplace_items", column: "id" },
  { table: "marketplace_categories", column: "id" },
];

async function deleteRows(table, column) {
  const before = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  if (before.error) {
    console.log(`count blocked ${table}: ${before.error.message}`);
  } else {
    console.log(`visible before ${table}: ${before.count ?? 0}`);
  }

  const { error, count } = await supabase
    .from(table)
    .delete({ count: "exact" })
    .neq(column, nilUuid);

  if (error) {
    console.log(`blocked ${table}: ${error.message}`);
    return false;
  }

  console.log(`deleted ${count ?? 0} row(s) from ${table}`);

  const after = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (!after.error) {
    console.log(`visible after ${table}: ${after.count ?? 0}`);
  }

  return true;
}

async function run() {
  let allDeleted = true;

  for (const { table, column } of tableDeletes) {
    const ok = await deleteRows(table, column);
    allDeleted = allDeleted && ok;
  }

  if (!allDeleted) {
    const currentAppItems = await supabase
      .from("marketplace_items")
      .select("*", { count: "exact", head: true })
      .gte("created_at", "2026-08-09T15:40:00.000Z");
    if (!currentAppItems.error) {
      console.log(
        `visible marketplace_items after app cutoff: ${currentAppItems.count ?? 0}`,
      );
    }

    process.exitCode = 1;
    console.log(
      "Some deletes were blocked by RLS. Use clear-marketplace-data.mjs with SUPABASE_DB_URL or a current Postgres password.",
    );
  }
}

run();

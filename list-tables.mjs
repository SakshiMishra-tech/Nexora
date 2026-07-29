import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const envFile = readFileSync(".env", "utf8");
let supabaseUrl = "";
let supabaseKey = "";
for (const line of envFile.split("\n")) {
  if (line.startsWith("VITE_SUPABASE_URL=")) supabaseUrl = line.split("=")[1].trim();
  if (line.startsWith("VITE_SUPABASE_ANON_KEY=")) supabaseKey = line.split("=")[1].trim();
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  const { data, error } = await supabase.rpc("get_tables");
  if (error) {
    // If RPC doesn't exist, try querying some common tables or running a raw sql
    console.log("RPC error:", error.message);
    
    // Let's check if we can query details from information_schema
    const { data: d2, error: e2 } = await supabase
      .from("marketplace_items")
      .select("*")
      .limit(1);
    console.log("marketplace_items exists:", !e2);

    const { error: e3 } = await supabase.from("marketplace_offers").select("*").limit(1);
    console.log("marketplace_offers exists:", !e3);

    const { error: e4 } = await supabase.from("marketplace_reports").select("*").limit(1);
    console.log("marketplace_reports exists:", !e4);

    const { error: e5 } = await supabase.from("marketplace_chats").select("*").limit(1);
    console.log("marketplace_chats exists:", !e5);

    const { error: e6 } = await supabase.from("chats").select("*").limit(1);
    console.log("chats exists:", !e6);

    const { error: e7 } = await supabase.from("messages").select("*").limit(1);
    console.log("messages exists:", !e7);

    const { error: e8 } = await supabase.from("offers").select("*").limit(1);
    console.log("offers exists:", !e8);

    const { error: e9 } = await supabase.from("reports").select("*").limit(1);
    console.log("reports exists:", !e9);

    const { error: e10 } = await supabase.from("profiles").select("*").limit(1);
    console.log("profiles exists:", !e10);
  } else {
    console.log("Tables:", data);
  }
}

listTables();

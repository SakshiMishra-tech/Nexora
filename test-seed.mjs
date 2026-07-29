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

async function testAuthInsert() {
  // Try to sign in as user to get an authenticated session
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: "student1@example.com",
    password: "password123"
  });

  if (authErr) {
    console.error("Auth error:", authErr.message);
    return;
  }

  console.log("Authenticated as:", auth.user.id);

  // Now try the insert
  const nameOnly = [{ name: "Books" }];
  console.log("Trying upsert with onConflict: name");
  const { data, error } = await supabase
    .from("marketplace_categories")
    .upsert(nameOnly, { onConflict: "name" })
    .select("*");

  if (error) {
    console.error("Upsert failed:", error);
    console.log("Trying regular insert...");
    const { data: d2, error: e2 } = await supabase
      .from("marketplace_categories")
      .insert(nameOnly)
      .select("*");
    
    if (e2) {
       console.error("Insert failed:", e2);
    } else {
       console.log("Insert succeeded!", d2);
    }
  } else {
    console.log("Upsert succeeded!", data);
  }
}

testAuthInsert();

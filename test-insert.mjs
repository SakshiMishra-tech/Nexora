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

async function testInsert() {
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: "student1@example.com",
    password: "password123"
  });

  if (authErr) {
    console.error("Auth error:", authErr.message);
    // Can't insert without auth if RLS is on.
  }

  const payload = {
    title: "Test",
    description: "Test",
    price: 10,
    category_id: null, // intentionally null or undefined
    location: "Campus", // testing location vs pickup_area
    status: "active",
  };

  if (auth?.user) {
    payload.seller_id = auth.user.id;
  }

  console.log("Attempting insert with location...");
  const { error: e1 } = await supabase.from("marketplace_items").insert(payload);
  console.log("Result 1:", e1?.code, e1?.message);

  if (e1?.code === "PGRST204") {
    console.log("Attempting insert with pickup_area...");
    delete payload.location;
    payload.pickup_area = "Campus";
    const { error: e2 } = await supabase.from("marketplace_items").insert(payload);
    console.log("Result 2:", e2?.code, e2?.message);
  }
}

testInsert();

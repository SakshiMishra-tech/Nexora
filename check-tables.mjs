import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const envFile = readFileSync(".env", "utf8");
let supabaseUrl = "";
let supabaseKey = "";
for (const line of envFile.split("\n")) {
  if (line.startsWith("VITE_SUPABASE_URL=")) supabaseUrl = line.split("=")[1].trim();
  if (line.startsWith("VITE_SUPABASE_ANON_KEY=")) supabaseKey = line.split("=")[1].trim();
}

async function getOpenAPI() {
  const res = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`
    }
  });
  const data = await res.json();
  console.log("Tables:", Object.keys(data.definitions || {}));
}

getOpenAPI();

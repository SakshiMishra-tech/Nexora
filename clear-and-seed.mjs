import { createClient } from '@supabase/supabase-js';

if (process.env.ALLOW_DEMO_MARKETPLACE_SEED !== "true") {
  console.error(
    "Demo marketplace seeding is disabled. Set ALLOW_DEMO_MARKETPLACE_SEED=true only when you intentionally want fake marketplace data.",
  );
  process.exit(1);
}

const SUPABASE_URL = 'https://fzhheofzidenlclfqrim.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6aGhlb2Z6aWRlbmxjbGZxcmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1ODQ1OTQsImV4cCI6MjA5ODE2MDU5NH0.epEoJq8PHBW6UMzTEreo8_8Ty-PX-kxIGEShWwK2lms';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DEMO_SELLER_ID = '00000000-0000-0000-0000-000000000000'; // dummy UUID

const itemsToInsert = [
  {
    title: "Hero Sprint 26T Cycle",
    price: 3200,
    condition: "Used",
    category: "Cycles",
    images: ["/product_cycle.png"],
    location: "Delhi Technological University",
    description: "6-month-old Hero Sprint cycle. Slightly used, good condition. Disc brakes, 21 gears. Selling as I got a hostel nearby.",
  },
  {
    title: "Dell Inspiron 15 (i5, 8GB RAM)",
    price: 28000,
    condition: "Used",
    category: "Electronics",
    images: ["/product_laptop.png"],
    location: "NSUT West Campus",
    description: "2021 Dell Inspiron. 256GB SSD + 1TB HDD. Perfect for coding and assignments. Charger included. Minor cosmetic scratch.",
  },
  {
    title: "Logitech G304 Wireless Mouse",
    price: 1100,
    condition: "Like new",
    category: "Electronics",
    images: ["/product_mouse.png"],
    location: "Amity Noida",
    description: "Barely used for 2 months. Comes with USB receiver and original box. Battery life is great — lasts weeks.",
  },
];

async function run() {
  console.log("Fetching categories...");
  const { data: categories } = await supabase.from('marketplace_categories').select('*');
  const catMap = {};
  if (categories) {
    categories.forEach(c => catMap[c.name] = c.id);
  }

  console.log("Deleting all items...");
  await supabase.from('marketplace_items').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // delete all

  console.log("Inserting demo items...");
  
  for (let i = 0; i < itemsToInsert.length; i++) {
    const item = itemsToInsert[i];
    
    // Spread created_at dates over the last 30 days
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    const { data: insertedItem, error } = await supabase.from('marketplace_items').insert({
      title: item.title,
      description: item.description,
      category_id: catMap[item.category] || null,
      condition: item.condition,
      price: item.price,
      location: item.location,
      status: 'available',
      is_active: true,
      is_negotiable: Math.random() > 0.5,
      seller_id: DEMO_SELLER_ID,
      created_at: date.toISOString(),
      updated_at: date.toISOString(),
      attributes: {
        campus: item.location,
        pickup: item.location
      }
    }).select().single();

    if (error) {
      console.error("Error inserting item:", item.title, error);
      continue;
    }

    if (item.images && item.images.length > 0) {
      for (let j = 0; j < item.images.length; j++) {
        await supabase.from('marketplace_images').insert({
          item_id: insertedItem.id,
          image_url: item.images[j],
          display_order: j + 1
        });
      }
    }
  }

  console.log(`Successfully seeded ${itemsToInsert.length} realistic items.`);
}

run();

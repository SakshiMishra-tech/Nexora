import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const categories = [
  "Books",
  "Electronics",
  "Hostel Essentials",
  "Furniture",
  "Fashion",
  "Sports",
  "Cycles",
  "Gaming",
  "Lab Equipment",
  "Others"
];

const items = [
  // Books
  { title: "DBMS Book", desc: "Database Management Systems by Raghu Ramakrishnan. Good condition.", price: 400, condition: "Good", category: "Books" },
  { title: "Operating Systems", desc: "Operating System Concepts by Galvin. No markings.", price: 450, condition: "Like new", category: "Books" },
  { title: "Computer Networks", desc: "Computer Networking by Kurose. Fifth edition.", price: 350, condition: "Used", category: "Books" },
  { title: "DSA Made Easy", desc: "Data Structures and Algorithms Made Easy by Narasimha Karumanchi. Very useful for placements.", price: 300, condition: "Good", category: "Books" },
  { title: "Java Programming", desc: "Head First Java. Fun way to learn Java.", price: 250, condition: "Used", category: "Books" },
  
  // Electronics
  { title: "HP Laptop", desc: "HP Pavilion 15.6 inch, i5 10th Gen, 8GB RAM, 512GB SSD. Perfect for coding.", price: 35000, condition: "Good", category: "Electronics" },
  { title: "Dell Monitor", desc: "Dell 24 inch IPS Monitor (S2421HN). Used for 1 year.", price: 8000, condition: "Like new", category: "Electronics" },
  { title: "Logitech Mouse", desc: "Logitech G102 gaming mouse. Working perfectly.", price: 900, condition: "Good", category: "Electronics" },
  { title: "Mechanical Keyboard", desc: "Redgear Shadow Blade mechanical keyboard with Blue switches.", price: 1500, condition: "Fair", category: "Electronics" },
  { title: "Scientific Calculator", desc: "Casio fx-991EX ClassWiz. Allowed in exams.", price: 850, condition: "Good", category: "Electronics" },
  { title: "Sony Headphones", desc: "Sony WH-CH510 wireless headphones. Battery lasts 30 hours.", price: 2000, condition: "Used", category: "Electronics" },

  // Hostel Essentials
  { title: "Study Table", desc: "Foldable wooden study table for bed.", price: 400, condition: "Used", category: "Hostel Essentials" },
  { title: "Mattress", desc: "Single bed cotton mattress. Clean and comfortable.", price: 800, condition: "Fair", category: "Hostel Essentials" },
  { title: "Electric Kettle", desc: "Pigeon 1.5L electric kettle. Essential for maggi.", price: 450, condition: "Good", category: "Hostel Essentials" },
  { title: "Cooler", desc: "Symphony Diet 12T personal cooler. Perfect for summers.", price: 3500, condition: "Good", category: "Hostel Essentials" },
  { title: "Induction", desc: "Prestige Induction Cooktop 1200 Watt.", price: 1200, condition: "Like new", category: "Hostel Essentials" },
  { title: "Bucket", desc: "Large plastic bucket with mug.", price: 150, condition: "Used", category: "Hostel Essentials" },

  // Furniture
  { title: "Chair", desc: "Ergonomic study chair with lumbar support.", price: 1500, condition: "Good", category: "Furniture" },
  { title: "Bookshelf", desc: "3-tier wooden bookshelf. Easy to assemble.", price: 600, condition: "Fair", category: "Furniture" },
  { title: "Study Lamp", desc: "Wipro LED desk lamp with adjustable brightness.", price: 500, condition: "Like new", category: "Furniture" },

  // Fashion
  { title: "Hoodie", desc: "College Fest 2023 Hoodie, Size L. Worn twice.", price: 400, condition: "Like new", category: "Fashion" },
  { title: "Shoes", desc: "Puma Sneakers, UK Size 9. Black.", price: 1200, condition: "Good", category: "Fashion" },
  { title: "Jacket", desc: "Denim jacket, Size M. Great for winters.", price: 800, condition: "Good", category: "Fashion" },
  { title: "Backpack", desc: "American Tourister laptop backpack.", price: 900, condition: "Fair", category: "Fashion" },

  // Sports
  { title: "Cricket Bat", desc: "Kashmir Willow cricket bat. Pre-knocked.", price: 1200, condition: "Good", category: "Sports" },
  { title: "Football", desc: "Nivia football, size 5. Needs a bit of air.", price: 300, condition: "Used", category: "Sports" },
  { title: "Dumbbells", desc: "5kg pair of PVC dumbbells.", price: 400, condition: "Good", category: "Sports" },

  // Cycles
  { title: "Hero Cycle", desc: "Hero Sprint 26T. Serviced last month.", price: 2500, condition: "Good", category: "Cycles" },
  { title: "Btwin Cycle", desc: "Btwin MyBike from Decathlon. Smooth ride.", price: 3500, condition: "Good", category: "Cycles" },
  { title: "Firefox Cycle", desc: "Firefox Rapide 21 speed gear cycle.", price: 7000, condition: "Like new", category: "Cycles" },

  // Gaming
  { title: "PS5 Controller", desc: "DualSense wireless controller. White.", price: 4500, condition: "Like new", category: "Gaming" },
  { title: "Xbox Controller", desc: "Xbox Series X/S controller with Bluetooth.", price: 3800, condition: "Good", category: "Gaming" },
  { title: "Gaming Mouse", desc: "Razer DeathAdder Essential.", price: 1100, condition: "Good", category: "Gaming" },

  // Others
  { title: "Whiteboard", desc: "2x3 feet whiteboard with markers.", price: 500, condition: "Good", category: "Others" },
  { title: "Mini Fridge", desc: "Haier 53L mini refrigerator. Keeps drinks cold.", price: 6000, condition: "Good", category: "Others" },
  { title: "Printer", desc: "HP DeskJet 2331 color printer.", price: 2000, condition: "Fair", category: "Others" }
];

const extraItems = [
  { title: "Engineering Mathematics", desc: "BS Grewal 44th Edition.", price: 450, condition: "Good", category: "Books" },
  { title: "Microprocessor 8085", desc: "Ramesh Gaonkar Book.", price: 300, condition: "Used", category: "Books" },
  { title: "iPad Air 4", desc: "64GB WiFi only. With Apple Pencil 2.", price: 42000, condition: "Like new", category: "Electronics" },
  { title: "Kindle Paperwhite", desc: "10th Gen, 8GB.", price: 6500, condition: "Good", category: "Electronics" },
  { title: "Water Bottle", desc: "Milton 1L stainless steel bottle.", price: 200, condition: "Used", category: "Hostel Essentials" },
  { title: "Cloth Drying Stand", desc: "Stainless steel foldable stand.", price: 700, condition: "Good", category: "Hostel Essentials" },
  { title: "Bean Bag", desc: "XXL size bean bag with beans.", price: 1200, condition: "Good", category: "Furniture" },
  { title: "Laptop Table", desc: "Wooden folding table.", price: 450, condition: "Good", category: "Furniture" },
  { title: "Formal Shirt", desc: "White Van Heusen shirt, Size 40.", price: 600, condition: "Like new", category: "Fashion" },
  { title: "Track Pants", desc: "Adidas track pants, Size L.", price: 750, condition: "Good", category: "Fashion" },
  { title: "Tennis Racket", desc: "Yonex ZR 100 Light.", price: 600, condition: "Good", category: "Sports" },
  { title: "Basketball", desc: "Spalding NBA basketball.", price: 800, condition: "Good", category: "Sports" },
  { title: "Hercules Roadeo", desc: "Roadeo A50 21 speed.", price: 5000, condition: "Good", category: "Cycles" },
  { title: "Gear Cycle", desc: "Mach City 21 speed.", price: 4500, condition: "Fair", category: "Cycles" },
  { title: "PS4 Games Bundle", desc: "GOW, Uncharted 4, Horizon Zero Dawn.", price: 1500, condition: "Good", category: "Gaming" },
  { title: "Gaming Headset", desc: "HyperX Cloud Stinger.", price: 2500, condition: "Good", category: "Gaming" },
  { title: "Scientific Poster", desc: "A0 size presentation poster.", price: 100, condition: "Used", category: "Others" },
  { title: "Extension Board", desc: "Belkin 4-socket surge protector.", price: 400, condition: "Good", category: "Others" },
  { title: "Iron", desc: "Philips dry iron.", price: 350, condition: "Good", category: "Hostel Essentials" },
  { title: "Heater", desc: "Usha room heater.", price: 900, condition: "Good", category: "Hostel Essentials" },
  { title: "Lab Coat", desc: "White lab coat for chemistry labs. Size M.", price: 250, condition: "Used", category: "Lab Equipment" },
  { title: "Drafter", desc: "Mini drafter for Engineering Drawing.", price: 150, condition: "Good", category: "Lab Equipment" },
  { title: "Breadboard", desc: "Large breadboard with connecting wires.", price: 200, condition: "Like new", category: "Lab Equipment" }
];

items.push(...extraItems);
const locations = ["Hostel 1", "Hostel 2", "Hostel 3", "Hostel 4", "Library", "CSE Block", "Main Canteen"];
const campuses = ["North Campus", "South Campus", "East Campus", "West Campus"];

async function run() {
  console.log("Starting seed process...");
  
  // 1. Create a dummy user
  const email = "demo.seller@nexora.com";
  const password = "password123456";
  
  let { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: "Demo Seller"
      }
    }
  });

  // If already registered, log in
  if (authErr?.message?.includes("already registered")) {
    const res = await supabase.auth.signInWithPassword({ email, password });
    authData = res.data;
  } else if (authErr) {
    console.error("Auth error:", authErr);
    // Ignore and proceed, we might have public access
  }

  const userId = authData?.user?.id;
  console.log("User ID:", userId);

  // 2. Insert Categories
  for (const cat of categories) {
    await supabase.from('marketplace_categories').insert({ name: cat }).select();
  }
  
  // Get Categories
  const { data: dbCats, error: catErr } = await supabase.from('marketplace_categories').select('*');
  if (catErr) {
    console.error("Could not fetch categories:", catErr);
    return;
  }
  
  const catMap = {};
  dbCats.forEach(c => { catMap[c.name] = c.id; });

  // 3. Insert Items
  let inserted = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const catId = catMap[item.category];
    const pickup = locations[i % locations.length];
    
    // random date within last 30 days
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));

    const coverUrl = `https://picsum.photos/seed/${i}a/600/400`;

    // Attempt to insert
    const { data: insertedItem, error: err } = await supabase.from('marketplace_items').insert({
      seller_id: userId,
      title: item.title,
      description: item.desc,
      category_id: catId,
      condition: item.condition,
      price: item.price,
      is_negotiable: Math.random() > 0.5,
      created_at: date.toISOString(),
      cover_image: coverUrl,
      status: 'available'
    }).select().single();

    if (err) {
      console.error("Failed to insert item:", item.title, err);
      continue;
    }

    if (insertedItem) {
      // 4. Insert Images
      await supabase.from('marketplace_images').insert([
        { item_id: insertedItem.id, image_url: coverUrl, position: 0 },
        { item_id: insertedItem.id, image_url: `https://picsum.photos/seed/${i}b/600/400`, position: 1 }
      ]);
      inserted++;
    }
  }

  console.log(`Successfully inserted ${inserted} items.`);
}

run();

import fs from 'fs';
import path from 'path';

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

// We will map each category to a pre-generated UUID
const categoryMap = {};
categories.forEach(c => {
  categoryMap[c] = `gen_random_uuid()`;
});

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

// Add more items to reach ~80
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
  { title: "Heater", desc: "Usha room heater.", price: 900, condition: "Good", category: "Hostel Essentials" }
];

items.push(...extraItems);

const campuses = ["North Campus", "South Campus", "East Campus", "West Campus"];
const locations = ["Hostel 1", "Hostel 2", "Hostel 3", "Hostel 4", "Library", "CSE Block", "Main Canteen"];

// Dummy User UUID to use as seller
// This will be replaced by a subquery or a dummy user in SQL
let sql = `
-- Create Marketplace Schema if it doesn't exist
CREATE TABLE IF NOT EXISTS public.marketplace_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.marketplace_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_name text,
  seller_course text,
  seller_avatar text,
  seller_rating numeric DEFAULT 4.5,
  title text NOT NULL,
  description text NOT NULL,
  category_id uuid REFERENCES public.marketplace_categories(id),
  category text,
  condition text,
  price numeric DEFAULT 0,
  pickup_area text,
  status text DEFAULT 'active',
  tags text[],
  is_negotiable boolean DEFAULT false,
  views numeric DEFAULT 0,
  saves numeric DEFAULT 0,
  offer_count numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  cover_image text
);

CREATE TABLE IF NOT EXISTS public.marketplace_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  storage_path text,
  position integer DEFAULT 0
);

-- First, ensure a dummy user exists for these listings
DO $$
DECLARE
  dummy_user_id uuid := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- We won't insert into auth.users directly if it's restricted, but assuming local dev environment we might.
  -- Better approach: assign to an existing user or leave seller_id null if it allows null.
  -- The schema shows seller_id references auth.users(id). 
  -- Let's just create a dummy auth user and profile.
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = dummy_user_id) THEN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES (dummy_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'demo.seller@nexora.com', 'dummy_hash', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Demo Seller"}', now(), now(), '', '', '', '');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = dummy_user_id) THEN
    INSERT INTO public.profiles (id, full_name, email, college_name)
    VALUES (dummy_user_id, 'Demo Seller', 'demo.seller@nexora.com', 'Nexora Institute');
  END IF;
END $$;

-- Populate Categories
INSERT INTO public.marketplace_categories (name) VALUES
${categories.map(c => `  ('${c}')`).join(',\n')}
ON CONFLICT (name) DO NOTHING;

-- Populate Items and Images
DO $$
DECLARE
  dummy_user_id uuid := '00000000-0000-0000-0000-000000000000';
  cat_id uuid;
  new_item_id uuid;
  random_days int;
  random_views int;
  random_likes int;
  random_neg bool;
BEGIN
`;

items.forEach((item, index) => {
  const pickup = locations[index % locations.length];
  const tags = `{"demo","${item.category.toLowerCase()}"}`;
  
  // Images
  const imgUrl1 = `https://picsum.photos/seed/${index}a/600/400`;
  const imgUrl2 = `https://picsum.photos/seed/${index}b/600/400`;

  sql += `
  -- Item: ${item.title.replace(/'/g, "''")}
  SELECT id INTO cat_id FROM public.marketplace_categories WHERE name = '${item.category}';
  random_days := floor(random() * 30)::int;
  random_views := floor(random() * 200)::int;
  random_likes := floor(random() * 20)::int;
  random_neg := random() > 0.5;

  INSERT INTO public.marketplace_items (
    seller_id, seller_name, seller_course, title, description,
    category_id, category, condition, price, pickup_area,
    tags, is_negotiable, views, saves, created_at, cover_image
  ) VALUES (
    dummy_user_id, 'Demo Seller', 'B.Tech', '${item.title.replace(/'/g, "''")}', '${item.desc.replace(/'/g, "''")}',
    cat_id, '${item.category}', '${item.condition}', ${item.price}, '${pickup}',
    '${tags}', random_neg, random_views, random_likes, now() - (random_days || ' days')::interval, '${imgUrl1}'
  ) RETURNING id INTO new_item_id;

  INSERT INTO public.marketplace_images (item_id, image_url, position) VALUES
  (new_item_id, '${imgUrl1}', 0),
  (new_item_id, '${imgUrl2}', 1);
`;
});

sql += `
END $$;
`;

fs.writeFileSync(path.join(process.cwd(), 'supabase', 'seed_marketplace.sql'), sql);
console.log('Seed SQL generated at supabase/seed_marketplace.sql');

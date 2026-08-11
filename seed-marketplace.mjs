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
  // Books
  {
    title: 'DSA Made Easy',
    description: 'Narasimha Karumanchi. Perfect for interview preparation. Barely used.',
    category: 'Books',
    condition: 'Like new',
    price: 450,
    location: 'Main Campus',
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'Operating System Concepts (10th Ed)',
    description: 'Dinosaur book (10th Edition) for OS. Has some highlights but overall good condition.',
    category: 'Books',
    condition: 'Good',
    price: 300,
    location: 'Library Cafe',
    images: ['https://images.unsplash.com/photo-1589998059171-989d887dda6e?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'Database System Concepts (DBMS)',
    description: 'Standard textbook for DBMS.',
    category: 'Books',
    condition: 'Fair',
    price: 350,
    location: 'North Campus',
    images: ['https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'DBMS Notes',
    description: 'Complete handwritten notes for Database Management Systems covering all normalization forms and transaction control.',
    category: 'Notes',
    condition: 'Good',
    price: 150,
    location: 'South Campus',
    images: ['https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'Higher Engineering Mathematics',
    description: 'BS Grewal, excellent condition.',
    category: 'Books',
    condition: 'Like New',
    price: 500,
    location: 'Visvesvaraya Hostel',
    images: ['https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=600&auto=format&fit=crop']
  },

  // Electronics
  {
    title: 'Casio Scientific Calculator FX-991EX',
    description: 'Classwiz calculator, allowed in exams. Fully working.',
    category: 'Electronics',
    condition: 'Good',
    price: 600,
    location: 'Bhabha Hostel',
    images: ['https://images.unsplash.com/photo-1587145820266-a5951ee6f620?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'Dell Inspiron 15',
    description: 'i5 11th Gen, 16GB RAM, 512GB SSD. Used for 2 years. Battery lasts ~3 hours. Good for coding.',
    category: 'Electronics',
    condition: 'Good',
    price: 25000,
    location: 'Main Campus',
    images: ['https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'Logitech Mouse (M331)',
    description: 'Silent wireless mouse. Perfect for library use. Includes new battery.',
    category: 'Electronics',
    condition: 'Like new',
    price: 600,
    location: 'North Campus',
    images: ['https://images.unsplash.com/photo-1527814050087-379381547969?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'Mechanical Keyboard (Red Switches)',
    description: 'Cosmic Byte CB-GK-16. TKL size. All keys working perfectly. Replaced with a new one.',
    category: 'Electronics',
    condition: 'Good',
    price: 1200,
    location: 'South Campus',
    images: ['https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=600&auto=format&fit=crop']
  },

  // Cycles
  {
    title: 'Hero Sprint',
    description: '21 gears, good tires. Needs minor oiling. Used for 1 year to commute from hostel to classes.',
    category: 'Cycles',
    condition: 'Good',
    price: 3000,
    location: 'Main Campus',
    images: ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'Firefox Road Cycle',
    description: 'Lightweight aluminium frame. Excellent condition. Selling because I am graduating.',
    category: 'Cycles',
    condition: 'Like new',
    price: 5500,
    location: 'North Campus',
    images: ['https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=600&auto=format&fit=crop']
  },

  // Hostel Essentials
  {
    title: 'Wooden Study Table',
    description: 'Sturdy table with one drawer.',
    category: 'Hostel Essentials',
    condition: 'Good',
    price: 800,
    location: 'Visvesvaraya Hostel',
    images: ['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'Study Lamp',
    description: 'Wipro Garnet 6W LED Table lamp. Adjustable brightness and flexible neck.',
    category: 'Hostel Essentials',
    condition: 'Like new',
    price: 450,
    location: 'South Campus',
    images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'Single Bed Mattress',
    description: 'Standard hostel bed size (72x36 inches). Clean and comfortable. Sleepwell brand.',
    category: 'Hostel Essentials',
    condition: 'Fair',
    price: 800,
    location: 'Main Campus',
    images: ['https://images.unsplash.com/photo-1505693314120-0d443867891c?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'Table Fan',
    description: 'Usha table fan, 3 speeds. High air delivery. Useful for summers in hostel.',
    category: 'Hostel Essentials',
    condition: 'Like New',
    price: 900,
    location: 'North Campus',
    images: ['https://images.unsplash.com/photo-1565151443833-28ea0283f514?q=80&w=600&auto=format&fit=crop']
  },

  // Fashion
  {
    title: 'Denim Jacket (Size M)',
    description: 'Barely worn, stylish blue denim.',
    category: 'Fashion',
    condition: 'Like New',
    price: 600,
    location: 'Food Court',
    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'H&M Black Hoodie (Size L)',
    description: 'Classic black hoodie, barely worn. Very warm for winters.',
    category: 'Fashion',
    condition: 'Like new',
    price: 700,
    location: 'Main Campus',
    images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'Puma Sneakers (UK 9)',
    description: 'White sneakers. Washed and clean. Good for everyday use.',
    category: 'Fashion',
    condition: 'Good',
    price: 1000,
    location: 'South Campus',
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop']
  },

  // Sports
  {
    title: 'Yonex Badminton Racket',
    description: 'Muscle Power 29. String intact.',
    category: 'Sports',
    condition: 'Good',
    price: 800,
    location: 'Sports Complex',
    images: ['https://images.unsplash.com/photo-1611172462310-911252069f16?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'Cricket Bat (Kashmir Willow)',
    description: 'Good stroke, grip needs replacement.',
    category: 'Sports',
    condition: 'Good',
    price: 1000,
    location: 'Visvesvaraya Hostel',
    images: ['https://images.unsplash.com/photo-1593766827228-8737b4534aa6?q=80&w=600&auto=format&fit=crop']
  },

  // Others
  {
    title: 'Prestige Electric Cooker',
    description: '1.5L capacity. Perfect for Maggie and rice.',
    category: 'Others',
    condition: 'Good',
    price: 700,
    location: 'Aryabhatta Hostel',
    images: ['https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'Physics Lab Manuals',
    description: 'Complete set of readings and graphs for first-year physics lab. Verified by TA.',
    category: 'Others', // Fallback for Academic
    condition: 'Fair',
    price: 150,
    location: 'Main Campus',
    images: ['https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?q=80&w=600&auto=format&fit=crop']
  }
];

async function run() {
  console.log("Fetching categories...");
  const { data: categories } = await supabase.from('marketplace_categories').select('*');
  const catMap = {};
  if (categories) {
    categories.forEach(c => catMap[c.name] = c.id);
  }

  console.log("Deleting existing dummy items...");
  await supabase.from('marketplace_items').delete().neq('seller_id', 'some-non-existent-id');

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

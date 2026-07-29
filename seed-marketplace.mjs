import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fzhheofzidenlclfqrim.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6aGhlb2Z6aWRlbmxjbGZxcmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1ODQ1OTQsImV4cCI6MjA5ODE2MDU5NH0.epEoJq8PHBW6UMzTEreo8_8Ty-PX-kxIGEShWwK2lms';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DEMO_SELLER_ID = '00000000-0000-0000-0000-000000000000'; // dummy UUID

const itemsToInsert = [
  // Books (6)
  {
    title: 'DSA Made Easy',
    description: 'Perfect for interview preparation. Barely used.',
    category: 'Books',
    condition: 'Like New',
    price: 450,
    location: 'Bhabha Hostel',
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'Operating System Concepts (10th Ed)',
    description: 'Dinosaur book for OS. Has some highlights.',
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
    location: 'Main Gate',
    images: ['https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'Java The Complete Reference',
    description: 'Comprehensive guide for Java programming.',
    category: 'Books',
    condition: 'Good',
    price: 400,
    location: 'Ramanujan Hostel',
    images: ['https://images.unsplash.com/photo-1512820200502-9ed146698675?q=80&w=600&auto=format&fit=crop']
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
  {
    title: 'Digital Logic and Computer Design',
    description: 'Morris Mano textbook for DLD.',
    category: 'Books',
    condition: 'Fair',
    price: 200,
    location: 'CS Block',
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop']
  },

  // Electronics (5)
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
    title: 'Logitech Wireless Keyboard',
    description: 'Compact wireless keyboard. Batteries included.',
    category: 'Electronics',
    condition: 'Like New',
    price: 800,
    location: 'Food Court',
    images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'Gaming Mouse',
    description: 'Razer DeathAdder. Good for gaming and coding.',
    category: 'Electronics',
    condition: 'Good',
    price: 900,
    location: 'Ramanujan Hostel',
    images: ['https://images.unsplash.com/photo-1527814050087-379381547969?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'Adjustable Laptop Stand',
    description: 'Aluminium stand, good for posture.',
    category: 'Electronics',
    condition: 'Like New',
    price: 450,
    location: 'Library',
    images: ['https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'Dell 24-inch Monitor',
    description: '1080p IPS display. Great for dual screen setup.',
    category: 'Electronics',
    condition: 'Good',
    price: 4500,
    location: 'Aryabhatta Hostel',
    images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=600&auto=format&fit=crop']
  },

  // Hostel (4)
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
    title: 'Single Bed Mattress',
    description: 'Standard hostel bed size. Clean.',
    category: 'Hostel Essentials',
    condition: 'Fair',
    price: 500,
    location: 'Bhabha Hostel',
    images: ['https://images.unsplash.com/photo-1505693314120-0d443867891c?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'Ergonomic Chair',
    description: 'Comfortable mesh chair for long study hours.',
    category: 'Hostel Essentials',
    condition: 'Like New',
    price: 1200,
    location: 'Ramanujan Hostel',
    images: ['https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'Milton 1L Water Bottle',
    description: 'Stainless steel, keeps water cold.',
    category: 'Hostel Essentials',
    condition: 'Like New',
    price: 200,
    location: 'Main Gate',
    images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=600&auto=format&fit=crop']
  },

  // Cycles (3)
  {
    title: 'Hero Sprint Cycle',
    description: '21 gears, good tires. Needs minor oiling.',
    category: 'Cycles',
    condition: 'Good',
    price: 2500,
    location: 'Cycle Stand A',
    images: ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'Firefox Mountain Bike',
    description: 'Excellent condition, used for 1 semester only.',
    category: 'Cycles',
    condition: 'Like New',
    price: 4500,
    location: 'Aryabhatta Hostel',
    images: ['https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'Hercules Basic Cycle',
    description: 'Single speed cycle. Perfect for campus commute.',
    category: 'Cycles',
    condition: 'Fair',
    price: 1500,
    location: 'Bhabha Hostel',
    images: ['https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?q=80&w=600&auto=format&fit=crop']
  },

  // Fashion (3)
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
    title: 'Nike Running Shoes (Size 9)',
    description: 'Used for a month. Washed and clean.',
    category: 'Fashion',
    condition: 'Good',
    price: 1200,
    location: 'Sports Complex',
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'Formal White Shirt (Size L)',
    description: 'Perfect for placements or presentations.',
    category: 'Fashion',
    condition: 'Like New',
    price: 300,
    location: 'Ramanujan Hostel',
    images: ['https://images.unsplash.com/photo-1620012253295-c15ce331c896?q=80&w=600&auto=format&fit=crop']
  },

  // Sports (3)
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
    title: 'Nivia Football',
    description: 'Size 5. Slightly used.',
    category: 'Sports',
    condition: 'Fair',
    price: 300,
    location: 'Football Ground',
    images: ['https://images.unsplash.com/photo-1614632537197-38a47059e670?q=80&w=600&auto=format&fit=crop']
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

  // Kitchen (3)
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
    title: 'Pigeon Electric Kettle',
    description: 'Boils water fast. Cleaned recently.',
    category: 'Others',
    condition: 'Like New',
    price: 350,
    location: 'Bhabha Hostel',
    images: ['https://images.unsplash.com/photo-1594213114663-d94af98ff78b?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'Induction Cooktop',
    description: 'Philips 2100W induction. Works flawlessly.',
    category: 'Others',
    condition: 'Good',
    price: 1200,
    location: 'Ramanujan Hostel',
    images: ['https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=600&auto=format&fit=crop']
  },

  // Misc (4)
  {
    title: 'American Tourister Backpack',
    description: 'Spacious 32L bag. Minor tear on side pocket.',
    category: 'Others',
    condition: 'Fair',
    price: 400,
    location: 'Library',
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'HP DeskJet Printer',
    description: 'Color printer, needs new ink cartridges.',
    category: 'Electronics',
    condition: 'Fair',
    price: 1000,
    location: 'CS Block',
    images: ['https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'Sony Over-Ear Headphones',
    description: 'Great bass, wired headphones.',
    category: 'Electronics',
    condition: 'Good',
    price: 750,
    location: 'Bhabha Hostel',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'Mi Power Bank 10000mAh',
    description: 'Fast charging supported.',
    category: 'Electronics',
    condition: 'Like New',
    price: 600,
    location: 'Main Gate',
    images: ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=600&auto=format&fit=crop']
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

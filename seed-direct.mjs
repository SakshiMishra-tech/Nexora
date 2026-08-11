import pkg from "pg";
const { Client } = pkg;
import { randomUUID } from "crypto";

const connStr = "postgresql://postgres:gU8AiYdk3oUTh8ma@db.fzhheofzidenlclfqrim.supabase.co:5432/postgres";

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
    title: 'Operating System Concepts',
    description: 'Dinosaur book (10th Edition) for OS. Has some highlights but overall good condition.',
    category: 'Books',
    condition: 'Good',
    price: 350,
    location: 'North Campus',
    images: ['https://images.unsplash.com/photo-1589998059171-989d887dda6e?q=80&w=600&auto=format&fit=crop']
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
  // Electronics
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
    condition: 'Good',
    price: 900,
    location: 'North Campus',
    images: ['https://images.unsplash.com/photo-1565151443833-28ea0283f514?q=80&w=600&auto=format&fit=crop']
  },
  // Fashion
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
  // Academic
  {
    title: 'Semester 4 CS Notes',
    description: 'Comprehensive notes for OS, DBMS, Algorithms and Computer Networks. Scored 9 SGPA with these.',
    category: 'Notes',
    condition: 'Good',
    price: 300,
    location: 'North Campus',
    images: ['https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=600&auto=format&fit=crop']
  },
  {
    title: 'Physics Lab Manuals',
    description: 'Complete set of readings and graphs for first-year physics lab. Verified by TA.',
    category: 'Academic',
    condition: 'Fair',
    price: 150,
    location: 'Main Campus',
    images: ['https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?q=80&w=600&auto=format&fit=crop']
  }
];

async function run() {
  const client = new Client({ connectionString: connStr });
  
  try {
    await client.connect();
    
    const { rows: categories } = await client.query('SELECT * FROM marketplace_categories');
    const catMap = {};
    categories.forEach(c => catMap[c.name] = c.id);

    console.log("Deleting existing items...");
    await client.query("DELETE FROM marketplace_items WHERE seller_name = 'Demo Seller' OR seller_name IS NULL OR seller_id = '00000000-0000-0000-0000-000000000000'");
    
    for (const item of itemsToInsert) {
      const catId = catMap[item.category] || null;
      
      const res = await client.query(`
        INSERT INTO marketplace_items (
          title, description, category_id, condition, price, location, 
          status, is_active, is_negotiable, seller_name, category
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'active', true, true, 'Demo Seller', $7
        ) RETURNING id
      `, [item.title, item.description, catId, item.condition, item.price, item.location, item.category]);
      
      const itemId = res.rows[0].id;
      
      if (item.images && item.images.length > 0) {
        for (let j = 0; j < item.images.length; j++) {
          await client.query(`
            INSERT INTO marketplace_images (item_id, image_url, display_order)
            VALUES ($1, $2, $3)
          `, [itemId, item.images[j], j + 1]);
        }
      }
    }
    console.log("Successfully seeded", itemsToInsert.length, "items.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();

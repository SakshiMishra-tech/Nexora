const fs = require('fs');

const categories = ['Electronics', 'Books', 'Cycles', 'Furniture', 'Hostel Essentials', 'Clothing', 'Accessories', 'Lab Equipment', 'Notes', 'Sports', 'Free Items', 'Others'];
const conditions = ['New', 'Like new', 'Good', 'Fair', 'Used'];
const locations = ['Hostel 1', 'Hostel 2', 'Hostel 3', 'Hostel 4', 'Hostel 5', 'Girls Hostel Block A', 'Girls Hostel Block B', 'Library', 'CSE Block', 'Mech Block', 'ECE Block', 'Sports Complex', 'Main Gate', 'Gate 2', 'Canteen Area'];
const sellers = [
  { name: 'Jordan', avatar: 'student2', course: '3rd year CSE', rating: 4.8 },
  { name: 'Maya', avatar: 'student1', course: 'Final year IT', rating: 4.9 },
  { name: 'Priya', avatar: 'student3', course: '2nd year ECE', rating: 4.7 },
  { name: 'Rohan', avatar: 'student2', course: '2nd year Mech', rating: 4.6 },
  { name: 'Karan', avatar: 'student2', course: '1st year Civil', rating: 4.5 },
  { name: 'Nisha', avatar: 'student3', course: 'Final year CSE', rating: 4.9 },
  { name: 'Arjun', avatar: 'student2', course: '3rd year EEE', rating: 4.8 },
  { name: 'Sneha', avatar: 'student1', course: '2nd year IT', rating: 4.7 },
  { name: 'Rahul', avatar: 'student2', course: '4th year Mech', rating: 4.6 },
  { name: 'Aisha', avatar: 'student3', course: '1st year ECE', rating: 4.8 },
];

const items = {
  'Electronics': [
    { title: 'MacBook Air M2', price: [60000, 80000], desc: 'Barely used MacBook Air M2, 8GB RAM, 256GB SSD. Under warranty.' },
    { title: 'Dell XPS 13', price: [40000, 60000], desc: 'Great for coding, i7 10th gen, 16GB RAM. Small scratch on lid.' },
    { title: 'ThinkPad T14', price: [30000, 45000], desc: 'Solid build, 16GB RAM, perfect for heavy programming.' },
    { title: 'iPad Pro 11"', price: [40000, 55000], desc: 'With Apple Pencil 2. Used for taking notes.' },
    { title: 'Samsung Galaxy Tab S8', price: [30000, 45000], desc: 'Includes S-Pen. Good for media and notes.' },
    { title: 'Logitech G502 Gaming Mouse', price: [1500, 3000], desc: 'Perfect working condition. RGB works.' },
    { title: 'Keychron K2 Mechanical Keyboard', price: [4000, 6000], desc: 'Brown switches, wireless. Clean.' },
    { title: 'LG 24" IPS Monitor', price: [5000, 8000], desc: '1080p 75Hz. No dead pixels.' },
    { title: 'Sony WH-1000XM4 Headphones', price: [12000, 18000], desc: 'Noise cancellation is top notch. Pads are good.' },
    { title: 'Casio fx-991EX Calculator', price: [800, 1200], desc: 'Allowed in exams. Works perfectly.' },
    { title: 'Anker 20000mAh Power Bank', price: [1500, 2500], desc: 'Charges phone 4 times.' }
  ],
  'Books': [
    { title: 'Database System Concepts (Silberschatz)', price: [300, 600], desc: 'Standard textbook for DBMS. Highlighted.' },
    { title: 'Operating System Concepts (Galvin)', price: [350, 650], desc: 'Good condition, no missing pages.' },
    { title: 'Computer Networking (Kurose)', price: [400, 700], desc: 'Latest edition, practically new.' },
    { title: 'Introduction to Algorithms (CLRS)', price: [500, 900], desc: 'The DSA bible. Heavy book.' },
    { title: 'Head First Java', price: [250, 450], desc: 'Fun read, good for beginners.' },
    { title: 'Python Crash Course', price: [200, 400], desc: 'Great condition.' },
    { title: 'C++ Primer', price: [300, 600], desc: 'Very detailed.' },
    { title: 'Hands-On Machine Learning', price: [600, 1000], desc: 'O\'Reilly book, great for ML labs.' },
    { title: 'Higher Engineering Mathematics (B.S. Grewal)', price: [400, 700], desc: 'Must have for first year.' }
  ],
  'Notes': [
    { title: 'Complete 3rd Sem CSE Notes', price: [100, 200], desc: 'Handwritten notes for all subjects.' },
    { title: 'Physics Lab Manual (Solved)', price: [50, 150], desc: 'All experiments completed and signed.' },
    { title: 'First Year Assignment Bundle', price: [100, 250], desc: 'Reference for all major assignments.' },
    { title: 'Previous Year Papers (Solved, ECE)', price: [100, 200], desc: 'Last 5 years solved papers.' }
  ],
  'Furniture': [
    { title: 'Wooden Study Table', price: [1000, 2000], desc: 'Foldable, fits in hostel room.' },
    { title: 'Ergonomic Office Chair', price: [1500, 3000], desc: 'Good back support for long coding sessions.' },
    { title: 'Hostel Mattress (Cotton)', price: [500, 1000], desc: 'Clean, used for one semester.' },
    { title: 'Small Bookshelf', price: [400, 800], desc: 'Holds about 20 books.' },
    { title: 'Plastic Wardrobe/Drawer', price: [600, 1200], desc: '3-tier drawer.' },
    { title: 'Study Lamp (LED)', price: [200, 500], desc: 'Rechargeable.' },
    { title: 'Full Length Mirror', price: [300, 700], desc: 'Can be hung on door.' }
  ],
  'Cycles': [
    { title: 'Hero Sprint Pro', price: [3000, 5000], desc: 'Geared cycle. Needs air.' },
    { title: 'Firefox Meteor', price: [4000, 7000], desc: 'Well maintained, recently serviced.' },
    { title: 'Hercules Roadeo MTB', price: [3500, 6000], desc: 'Good suspension.' },
    { title: 'Atlas Campus Cycle', price: [2000, 3500], desc: 'Single speed, reliable.' }
  ],
  'Hostel Essentials': [
    { title: 'Plastic Bucket & Mug Set', price: [100, 200], desc: 'Unused.' },
    { title: 'Electric Kettle (1L)', price: [300, 600], desc: 'Makes maggi perfectly.' },
    { title: 'Induction Cooktop (Pigeon)', price: [800, 1500], desc: 'Works well.' },
    { title: 'Extension Board (4 sockets)', price: [150, 300], desc: 'Surge protected.' },
    { title: 'Table Fan (Usha)', price: [500, 1000], desc: 'Life saver in summer.' },
    { title: 'Electric Iron (Philips)', price: [300, 600], desc: 'Lightweight.' },
    { title: 'Milton Thermos Bottle', price: [200, 400], desc: 'Keeps water hot/cold.' }
  ],
  'Clothing': [
    { title: 'College Fest Hoodie (Size L)', price: [300, 600], desc: 'Official merch.' },
    { title: 'Denim Jacket (Size M)', price: [400, 800], desc: 'Barely worn.' },
    { title: 'Levis Jeans (32)', price: [500, 1000], desc: 'Blue, straight fit.' },
    { title: 'Puma Running Shoes (UK 9)', price: [800, 1500], desc: 'Good for gym.' },
    { title: 'Wildcraft Backpack', price: [400, 800], desc: 'Has laptop sleeve.' }
  ],
  'Sports': [
    { title: 'Nivia Football (Size 5)', price: [200, 400], desc: 'Used on turf.' },
    { title: 'Kashmir Willow Cricket Bat', price: [500, 1200], desc: 'Good stroke.' },
    { title: 'Yonex Badminton Racket', price: [400, 900], desc: 'Grip needs replacement.' },
    { title: 'Dumbbells (5kg Pair)', price: [400, 800], desc: 'Hex rubber.' },
    { title: 'Yoga Mat', price: [150, 300], desc: 'Anti-slip.' }
  ],
  'Accessories': [
    { title: 'Casio Vintage Watch', price: [800, 1500], desc: 'Silver, classic.' },
    { title: 'Boat Wired Earphones', price: [150, 300], desc: 'Bass is good.' },
    { title: 'Aluminum Laptop Stand', price: [300, 600], desc: 'Adjustable height.' },
    { title: 'Extended Mouse Pad', price: [200, 400], desc: 'World map design.' },
    { title: 'USB C Hub (4 ports)', price: [400, 800], desc: 'Has HDMI.' }
  ],
  'Free Items': [
    { title: 'Free Plastic Chair', price: [0, 0], desc: 'Moving out, take it.' },
    { title: 'Free 2nd Sem Notes', price: [0, 0], desc: 'Donating to juniors.' },
    { title: 'Free Old Fiction Books', price: [0, 0], desc: 'Dan Brown collection.' },
    { title: 'Free Chemistry Lab Coat', price: [0, 0], desc: 'Size M.' },
    { title: 'Free Bucket', price: [0, 0], desc: 'Clean.' }
  ]
};

const imagesMap = {
  'Electronics': 'productLaptop',
  'Books': 'productBooks',
  'Notes': 'productBooks',
  'Furniture': 'productLamp',
  'Cycles': 'productBike',
  'Hostel Essentials': 'productLamp',
  'Clothing': 'productBooks',
  'Sports': 'productBike',
  'Accessories': 'productLaptop',
  'Free Items': 'productLamp'
};

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

let out = `// Auto-generated seed data for marketplace
import productBike from "@/assets/product-bike.jpg";
import productBooks from "@/assets/product-books.jpg";
import productLaptop from "@/assets/product-laptop.jpg";
import productLamp from "@/assets/product-lamp.jpg";
import student1 from "@/assets/student-1.jpg";
import student2 from "@/assets/student-2.jpg";
import student3 from "@/assets/student-3.jpg";
import type { MarketplaceListing } from "./marketplace";

export const seedListingsGenerated: MarketplaceListing[] = [
`;

let idCounter = 1;
for (const [cat, templates] of Object.entries(items)) {
  for (const template of templates) {
    const numCopies = cat === 'Free Items' ? 1 : randomInt(1, 3);
    for (let i = 0; i < numCopies; i++) {
      const seller = randomItem(sellers);
      const cond = randomItem(conditions);
      const loc = randomItem(locations);
      let price = cat === 'Free Items' ? 0 : randomInt(template.price[0], template.price[1]);
      price = Math.round(price / 50) * 50; 
      
      const pastDays = randomInt(0, 30);
      const date = new Date(Date.now() - pastDays * 24 * 60 * 60 * 1000 - randomInt(0, 24) * 60 * 60 * 1000);
      
      const views = randomInt(5, 400);
      const saves = Math.floor(views * (randomInt(5, 20) / 100));
      const offers = Math.floor(saves * (randomInt(0, 30) / 100));
      const status = (cat !== 'Free Items' && Math.random() > 0.8) ? 'sold' : 'active';
      
      const tags = template.title.split(' ').map(s => s.toLowerCase()).slice(0, 3);
      
      out += `  {
    id: "item-gen-${idCounter++}",
    sellerId: "seller-${seller.name.toLowerCase()}",
    sellerName: "${seller.name}",
    sellerAvatar: ${seller.avatar},
    sellerCourse: "${seller.course}",
    sellerRating: ${seller.rating},
    title: ${JSON.stringify(template.title)},
    description: ${JSON.stringify(template.desc)},
    category: "${cat}" as any,
    condition: "${cond}" as any,
    price: ${price},
    pickupArea: "${loc}",
    images: [${imagesMap[cat]}],
    status: "${status}",
    tags: ${JSON.stringify(tags)},
    createdAt: "${date.toISOString()}",
    views: ${views},
    saves: ${saves},
    offerCount: ${offers},
  },
`;
    }
  }
}

out += '];\n';
fs.writeFileSync('src/lib/marketplace-seed.ts', out);
console.log('Generated ' + (idCounter-1) + ' listings.');

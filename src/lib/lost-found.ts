export type PostType = "Lost" | "Found" | "Recovered" | "Searching";

export type LostFoundPost = {
  id: string;
  type: PostType;
  itemName: string;
  category: string;
  description: string;
  location: string;
  campus: string;
  date: string;
  time: string;
  images: string[];
  postedBy: string;
  postedByAvatar?: string;
  createdAt: string;
  likes: number;
  comments: number;
};

export const LOST_FOUND_CATEGORIES = [
  "ID Card",
  "Wallet",
  "Keys",
  "Mobile Phone",
  "Laptop",
  "Earbuds / Headphones",
  "Charger",
  "Documents",
  "Books",
  "Bags",
  "Clothing",
  "Others",
];

export const LOST_FOUND_CAMPUSES = [
  "Nexora Main Campus",
  "South Campus",
  "North Campus",
];

export const seedLostFoundPosts: LostFoundPost[] = [
  {
    id: "lf-1",
    type: "Lost",
    itemName: "Black Leather Wallet with ID",
    category: "Wallet",
    description:
      "Hey everyone, I lost my black leather wallet near the library cafe around 2:30 PM today. It contains my student ID card, driver's license, and some cash. If anyone has found it, please let me know ASAP! I really need the ID for my exams tomorrow.",
    location: "Library Cafe",
    campus: "Nexora Main Campus",
    date: "2026-08-10",
    time: "14:30",
    images: [
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=800",
    ],
    postedBy: "Rahul Sharma",
    postedByAvatar:
      "https://ui-avatars.com/api/?name=Rahul+Sharma&background=4f46e5&color=fff",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    likes: 12,
    comments: 4,
  },
  {
    id: "lf-4",
    type: "Found",
    itemName: "Black Wallet near Library Steps",
    category: "Wallet",
    description:
      "Found a black wallet near the library steps after the afternoon rush. It has a student ID tucked inside. I am keeping the identifying details private, so please message with the name on the ID and one card inside to claim it.",
    location: "Library Steps",
    campus: "Nexora Main Campus",
    date: "2026-08-10",
    time: "15:05",
    images: [
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=800",
    ],
    postedBy: "Neha Iyer",
    postedByAvatar:
      "https://ui-avatars.com/api/?name=Neha+Iyer&background=0f766e&color=fff",
    createdAt: new Date(Date.now() - 2600000).toISOString(),
    likes: 28,
    comments: 7,
  },
  {
    id: "lf-2",
    type: "Found",
    itemName: "Apple AirPods Pro Case",
    category: "Earbuds / Headphones",
    description:
      "Found a white AirPods Pro case with both earbuds inside. Left it at the admin block reception with the security guard. It has a tiny blue scratch on the back. Claim it from the reception if it's yours!",
    location: "Admin Block",
    campus: "South Campus",
    date: "2026-08-09",
    time: "09:15",
    images: [
      "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&q=80&w=800",
    ],
    postedBy: "Priya Patel",
    postedByAvatar:
      "https://ui-avatars.com/api/?name=Priya+Patel&background=ec4899&color=fff",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    likes: 45,
    comments: 2,
  },
  {
    id: "lf-3",
    type: "Recovered",
    itemName: "MacBook Pro Charger",
    category: "Charger",
    description:
      "Update: The charger has been found! Huge thanks to Neha for returning it to the department office. Nexora community is the best!",
    location: "Mechanical Dept.",
    campus: "Nexora Main Campus",
    date: "2026-08-08",
    time: "16:00",
    images: [],
    postedBy: "Amit Singh",
    postedByAvatar:
      "https://ui-avatars.com/api/?name=Amit+Singh&background=10b981&color=fff",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    likes: 89,
    comments: 12,
  },
];

export function getLostFoundPostById(id: string) {
  return seedLostFoundPosts.find((post) => post.id === id);
}

export function timeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

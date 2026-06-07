// src/lib/mock-data.ts
// Simulates a real cursor-paginated API response
// In production this would be your Laravel backend

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  seller: string;
  rating: number;
  reviews: number;
  createdAt: string;
}

export interface PaginatedResponse {
  data: Product[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

export interface CursorResponse {
  data: Product[];
  next_cursor: string | null;
  has_more: boolean;
}

// ─── Seed 200 fake products ───────────────────────────────────────────────────

const CATEGORIES = [
  "Electronics", "Clothing", "Food", "Home", "Footwear",
  "Beauty", "Sports", "Books", "Garden", "Automotive"
];

const SELLERS = [
  "TechZone Lusaka", "Mama Bupe Designs", "Kafue Naturals",
  "SportsPlex Manda Hill", "Choma Craft Co.", "Foto Zambia",
  "Lusaka Electronics Hub", "African Attire Co.", "Fresh Farm Direct",
  "Capital City Goods", "Copperbelt Traders", "Southern Stores"
];

const PRODUCT_NAMES: Record<string, string[]> = {
  Electronics:  ["Samsung Galaxy A35", "Infinix Hot 40", "Tecno Spark 20", "JBL Speaker", "HP Laptop i5", "Canon Printer", "Router TP-Link", "LED TV 43\""],
  Clothing:     ["Chitenge Fabric 6yds", "Men's Suit", "African Print Dress", "Denim Jeans", "Cotton T-Shirt Set", "Zambia Jersey", "Winter Jacket", "Kanga Wrap"],
  Food:         ["Organic Honey 500g", "Mealie Meal 25kg", "Groundnuts 5kg", "Cooking Oil 5L", "Canned Tomatoes", "Dried Fish 2kg", "Sugar 2kg", "Kapenta 1kg"],
  Home:         ["Wicker Basket Set", "Wooden Stool", "Chitenge Cushions", "Wall Clock", "Mosquito Net", "Solar Lantern", "Water Filter", "Gas Stove 2 Burner"],
  Footwear:     ["Nike Air Max 270", "Bata School Shoes", "Sandals Leather", "Safety Boots", "Sneakers Canvas", "Heels 3\"", "Running Shoes", "Flip Flops Pack"],
  Beauty:       ["Shea Butter 250g", "African Black Soap", "Hair Braiding Kit", "Face Cream SPF50", "Coconut Oil", "Natural Lip Balm", "Body Lotion", "Aloe Vera Gel"],
  Sports:       ["Football Size 5", "Gym Gloves", "Yoga Mat", "Resistance Bands", "Water Bottle 1L", "Jump Rope", "Knee Guards", "Tennis Racket"],
  Books:        ["Python Programming", "Business in Africa", "Zambian History", "Accounting 101", "English Grammar", "STEM for Kids", "Investment Guide", "Leadership Book"],
  Garden:       ["Hoe Set 3pc", "Watering Can 10L", "Seeds Tomato", "Garden Gloves", "Wheelbarrow", "Rake Heavy Duty", "Compost Bag 20kg", "Pruning Shears"],
  Automotive:   ["Car Wax Polish", "Tyre Inflator", "Jump Starter", "Dash Camera", "Seat Covers", "Air Freshener", "Motor Oil 5L", "Car Vacuum"]
};

function generateProducts(): Product[] {
  const products: Product[] = [];
  let id = 1;

  for (let i = 0; i < 200; i++) {
    const category = CATEGORIES[i % CATEGORIES.length];
    const names = PRODUCT_NAMES[category];
    const name = names[i % names.length];
    const daysAgo = Math.floor(i * 0.7);
    const date = new Date(Date.now() - daysAgo * 86400000);

    products.push({
      id: id++,
      name,
      category,
      price: Math.floor(Math.random() * 9000) + 50,
      seller: SELLERS[Math.floor(Math.random() * SELLERS.length)],
      rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
      reviews: Math.floor(Math.random() * 400) + 5,
      createdAt: date.toISOString(),
    });
  }

  return products;
}

const ALL_PRODUCTS = generateProducts();

// ─── Simulate network latency ─────────────────────────────────────────────────

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// ─── Offset/Page-based (for Pagination demo) ─────────────────────────────────

export async function fetchProductsPage(
  page: number,
  perPage = 12
): Promise<PaginatedResponse> {
  await delay(600 + Math.random() * 400); // 600–1000ms simulated latency

  const total = ALL_PRODUCTS.length;
  const lastPage = Math.ceil(total / perPage);
  const from = (page - 1) * perPage;
  const to = Math.min(from + perPage, total);
  const data = ALL_PRODUCTS.slice(from, to);

  return {
    data,
    meta: {
      current_page: page,
      last_page: lastPage,
      per_page: perPage,
      total,
      from: from + 1,
      to,
    },
  };
}

// ─── Cursor-based (for Infinite Scroll demo) ──────────────────────────────────

function decodeCursor(cursor: string): { createdAt: string; id: number } {
  return JSON.parse(atob(cursor));
}

function encodeCursor(product: Product): string {
  return btoa(JSON.stringify({ createdAt: product.createdAt, id: product.id }));
}

export async function fetchProductsCursor(
  cursor?: string,
  limit = 12
): Promise<CursorResponse> {
  await delay(600 + Math.random() * 400);

  // Sort newest first (already ordered by decreasing createdAt)
  let startIndex = 0;

  if (cursor) {
    const { createdAt, id } = decodeCursor(cursor);
    // Find the item just after the cursor
    const cursorIndex = ALL_PRODUCTS.findIndex(
      p => p.createdAt === createdAt && p.id === id
    );
    startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
  }

  const slice = ALL_PRODUCTS.slice(startIndex, startIndex + limit + 1);
  const hasMore = slice.length > limit;
  const data = slice.slice(0, limit);

  return {
    data,
    next_cursor: hasMore ? encodeCursor(data[data.length - 1]) : null,
    has_more: hasMore,
  };
}

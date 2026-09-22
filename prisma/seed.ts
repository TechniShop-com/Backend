import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding TechniShop database...');

  // 1. School Locations
  await prisma.schoolLocation.deleteMany();
  const locWarszawa = await prisma.schoolLocation.create({
    data: {
      name: 'Techni Schools Warszawa',
      address: 'ul. Prosta 32',
      city: 'Warszawa',
    },
  });

  const locLublin = await prisma.schoolLocation.create({
    data: {
      name: 'Techni Schools Lublin',
      address: 'ul. Spokojna 2',
      city: 'Lublin',
    },
  });

  const locPoznan = await prisma.schoolLocation.create({
    data: {
      name: 'Techni Schools Poznań',
      address: 'ul. Św. Marcin 15',
      city: 'Poznań',
    },
  });

  // 2. Discount Codes
  await prisma.discountCode.deleteMany();
  await prisma.discountCode.createMany({
    data: [
      {
        code: 'TECHNI10',
        discountPercent: 10,
        minCartValue: 50,
        isActive: true,
      },
      {
        code: 'START20',
        discountAmount: 20,
        minCartValue: 100,
        isActive: true,
      },
    ],
  });

  // 3. Products & Variants
  await prisma.orderItem.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();

  // Product 1: Techni Schools Classic Hoodie
  await prisma.product.create({
    data: {
      title: 'Bluza Techni Schools Premium Hoodie',
      description: 'Klasyczna, cieptła bluza z kapturem i wyhaftowanym logo Techni Schools. 80% bawełna organiczna, 20% poliester.',
      brand: 'TECHNI_SCHOOLS',
      category: 'Odzież',
      imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
      variants: {
        create: [
          { sku: 'TS-HOODIE-NAVY-S', size: 'S', color: 'Granatowy', price: 179.99, stock: 15 },
          { sku: 'TS-HOODIE-NAVY-M', size: 'M', color: 'Granatowy', price: 179.99, stock: 25 },
          { sku: 'TS-HOODIE-NAVY-L', size: 'L', color: 'Granatowy', price: 179.99, stock: 20 },
          { sku: 'TS-HOODIE-NAVY-XL', size: 'XL', color: 'Granatowy', price: 179.99, stock: 10 },
          { sku: 'TS-HOODIE-BLACK-M', size: 'M', color: 'Czarny', price: 179.99, stock: 12 },
        ],
      },
    },
  });

  // Product 2: Techni Zdalni Cyber Hoodie
  await prisma.product.create({
    data: {
      title: 'Bluza Techni Zdalni Cyberpunk Edition',
      description: 'Nowoczesna bluza z motywem cyjanowo-fioletowym dla zdalnych pasjonatów technologii.',
      brand: 'TECHNI_ZDALNI',
      category: 'Odzież',
      imageUrl: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80',
      variants: {
        create: [
          { sku: 'TZ-HOODIE-CYAN-S', size: 'S', color: 'Cyjan', price: 189.99, stock: 8 },
          { sku: 'TZ-HOODIE-CYAN-M', size: 'M', color: 'Cyjan', price: 189.99, stock: 18 },
          { sku: 'TZ-HOODIE-CYAN-L', size: 'L', color: 'Cyjan', price: 189.99, stock: 14 },
          { sku: 'TZ-HOODIE-PURPLE-M', size: 'M', color: 'Fioletowy', price: 189.99, stock: 15 },
        ],
      },
    },
  });

  // Product 3: Techni Schools T-Shirt
  await prisma.product.create({
    data: {
      title: 'Koszulka Techni Schools Basic Tee',
      description: 'Wygodny, minimalistyczny t-shirt szkolny z subtelnym nadrukiem Techni Schools.',
      brand: 'TECHNI_SCHOOLS',
      category: 'Odzież',
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      variants: {
        create: [
          { sku: 'TS-TEE-WHITE-S', size: 'S', color: 'Biały', price: 69.99, stock: 30 },
          { sku: 'TS-TEE-WHITE-M', size: 'M', color: 'Biały', price: 69.99, stock: 40 },
          { sku: 'TS-TEE-WHITE-L', size: 'L', color: 'Biały', price: 69.99, stock: 25 },
          { sku: 'TS-TEE-NAVY-M', size: 'M', color: 'Granatowy', price: 69.99, stock: 35 },
        ],
      },
    },
  });

  // Product 4: Techni Zdalni Remote Dev T-Shirt
  await prisma.product.create({
    data: {
      title: 'Koszulka Techni Zdalni "Code From Anywhere"',
      description: 'T-shirt dla programistów pracujących zdalnie. Wysoka gramatura 190g/m².',
      brand: 'TECHNI_ZDALNI',
      category: 'Odzież',
      imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
      variants: {
        create: [
          { sku: 'TZ-TEE-BLACK-S', size: 'S', color: 'Czarny', price: 74.99, stock: 20 },
          { sku: 'TZ-TEE-BLACK-M', size: 'M', color: 'Czarny', price: 74.99, stock: 30 },
          { sku: 'TZ-TEE-BLACK-L', size: 'L', color: 'Czarny', price: 74.99, stock: 25 },
        ],
      },
    },
  });

  // Product 5: Techni Universal Bottle (BOTH)
  await prisma.product.create({
    data: {
      title: 'Bidon Termiczny Techni Hydro Flask 750ml',
      description: 'Podwójne ścianki ze stali nierdzewnej, trzyma zimno do 24h i ciepło do 12h. Nadruk łączony obu marek.',
      brand: 'BOTH',
      category: 'Akcesoria',
      imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
      variants: {
        create: [
          { sku: 'TECHNI-BOTTLE-STEEL', size: '750ml', color: 'Stalowy', price: 89.99, stock: 50 },
          { sku: 'TECHNI-BOTTLE-BLACK', size: '750ml', color: 'Matowy Czarny', price: 89.99, stock: 45 },
        ],
      },
    },
  });

  // Product 6: Techni Zdalni Desk Mat
  await prisma.product.create({
    data: {
      title: 'Podkładka pod mysz i klawiaturę Techni Zdalni XXL',
      description: 'Wymiary 900x450mm, antypoślizgowy spód, obszyte brzegi z podświetleniem akcentowym.',
      brand: 'TECHNI_ZDALNI',
      category: 'Akcesoria',
      imageUrl: 'https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2?auto=format&fit=crop&w=800&q=80',
      variants: {
        create: [
          { sku: 'TZ-MAT-XXL', size: '900x450mm', color: 'Cyjan-Fiolet', price: 99.99, stock: 22 },
        ],
      },
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

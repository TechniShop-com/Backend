import { prisma } from './db.js';

const INITIAL_PRODUCTS = [
  {
    id: 'hoodie-1',
    title: 'Bluza Hoodie Techni Signature',
    description: 'Ciepła bluza z kapturem oversize o gramaturze 380g/m² z haftowanym logo Techni i pojemną kieszenią kangurką.',
    price: 159.99,
    brand: 'TECHNI_SCHOOLS',
    gender: 'UNISEX',
    colors: JSON.stringify(['Fioletowa', 'Czarna', 'Szara']),
    sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
    imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'polo-women',
    title: 'Koszulka Polo Techni Women Fit',
    description: 'Dopasowana damska koszulka polo z kołnierzykiem ze szlachetnej bawełny Pique 220g/m².',
    price: 89.99,
    brand: 'TECHNI_SCHOOLS',
    gender: 'WOMEN',
    colors: JSON.stringify(['Fioletowa', 'Biała', 'Czarna']),
    sizes: JSON.stringify(['XS', 'S', 'M', 'L']),
    imageUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'polo-men',
    title: 'Koszulka Polo Techni Men Classic',
    description: 'Męska klasyczna koszulka polo z kołnierzykiem i haftem. Wykonana w 100% z bawełny Pique 220g/m².',
    price: 89.99,
    brand: 'TECHNI_SCHOOLS',
    gender: 'MEN',
    colors: JSON.stringify(['Fioletowa', 'Czarna', 'Biała']),
    sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
    imageUrl: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'tee-women',
    title: 'T-Shirt Techni Oversize Women',
    description: 'Modny damski t-shirt oversize z minimalistycznym haftem Techni i obniżoną linią ramion.',
    price: 74.99,
    brand: 'TECHNI_ZDALNI',
    gender: 'WOMEN',
    colors: JSON.stringify(['Fioletowa', 'Biała', 'Czarna']),
    sizes: JSON.stringify(['XS', 'S', 'M', 'L']),
    imageUrl: 'https://images.unsplash.com/photo-1527719327859-c6ce80353573?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'tee-men',
    title: 'T-Shirt Techni Dev Men Edition',
    description: 'Męski oddychający t-shirt z minimalistycznym nadrukiem dla pasjonatów programowania i technologii.',
    price: 69.99,
    brand: 'TECHNI_ZDALNI',
    gender: 'MEN',
    colors: JSON.stringify(['Czarna', 'Fioletowa', 'Biała']),
    sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
    imageUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'backpack-1',
    title: 'Plecak Techni TechPack 24L',
    description: 'Wodoodporny plecak z dedykowaną przegrodą na laptopa 15.6", ukrytą kieszenią antykradzieżową i wzmocnionym dnem.',
    price: 139.99,
    brand: 'TECHNI_ZDALNI',
    gender: 'UNISEX',
    colors: JSON.stringify(['Czarny', 'Fioletowy']),
    sizes: JSON.stringify(['Uniwersalny']),
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'thermo-1',
    title: 'Butelka Termiczna Techni 750ml',
    description: 'Dwuścienna butelka ze stali nierdzewnej z matowym wykończeniem. Trzyma ciepło przez 12h i chłód przez 24h.',
    price: 59.99,
    brand: 'TECHNI_SCHOOLS',
    gender: 'UNISEX',
    colors: JSON.stringify(['Fioletowa', 'Czarna', 'Srebrna']),
    sizes: JSON.stringify(['750ml']),
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'cap-1',
    title: 'Czapka Snapback Techni Street',
    description: 'Klasyczna czapka z prostym daszkiem, haftem 3D i regulacją z tyłu.',
    price: 49.99,
    brand: 'TECHNI_ZDALNI',
    gender: 'UNISEX',
    colors: JSON.stringify(['Czarna', 'Fioletowa']),
    sizes: JSON.stringify(['Uniwersalny']),
    imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80',
  },
];

export async function seed() {
  console.log('🌱 Rozpoczynanie wypełniania bazy danymi (seed)...');
  
  for (const product of INITIAL_PRODUCTS) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    });
  }

  console.log('✅ Baza danych została pomyślnie zainicjalizowana produktami.');
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seed()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}

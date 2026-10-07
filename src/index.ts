import dotenv from 'dotenv';
import { prisma } from './db.js';
import { seed } from './seed.js';
import { app } from './app.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Start serwera
async function startServer() {
  try {
    // Automatyczne sprawdzenie i wypełnienie danymi początkowymi, jeśli baza jest pusta
    const count = await prisma.product.count();
    if (count === 0) {
      console.log('📦 Baza produktów jest pusta, inicjalizacja domyślnych danych...');
      await seed();
    }

    app.listen(PORT, () => {
      console.log(`🚀 Serwer TechniShop Backend działa na: http://localhost:${PORT}`);
      console.log(`📌 Produkty:  http://localhost:${PORT}/api/products`);
      console.log(`📌 Koszyk:    http://localhost:${PORT}/api/cart`);
      console.log(`📌 Zamówienia: http://localhost:${PORT}/api/orders`);
      console.log(`📌 Status:    http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Błąd uruchamiania serwera:', error);
    process.exit(1);
  }
}

if (process.env.VERCEL !== '1') {
  startServer();
}

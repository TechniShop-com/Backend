import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { productsRouter } from './routes/products.js';
import { cartRouter } from './routes/cart.js';
import { ordersRouter } from './routes/orders.js';
import { authRouter } from './routes/auth.js';
import { prisma } from './db.js';
import { seed } from './seed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint statusu / health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'TechniShop API działa prawidłowo',
    timestamp: new Date().toISOString(),
  });
});

// Rejestracja tras API
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/auth', authRouter);

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

startServer();

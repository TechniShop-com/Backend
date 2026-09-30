import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

export const productsRouter = Router();

// Helper do formatowania produktu dla frontendu (parsuje kolory i rozmiary z JSON)
function formatProduct(product: any) {
  return {
    ...product,
    colors: typeof product.colors === 'string' ? JSON.parse(product.colors) : product.colors,
    sizes: typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes,
  };
}

// GET /api/products - Pobierz wszystkie produkty (opcjonalne filtry: brand, gender, search)
productsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { brand, gender, search } = req.query;

    const whereClause: any = {};
    if (brand && typeof brand === 'string') {
      whereClause.brand = brand;
    }
    if (gender && typeof gender === 'string') {
      whereClause.gender = gender;
    }
    if (search && typeof search === 'string') {
      whereClause.title = { contains: search };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    res.json(products.map(formatProduct));
  } catch (error) {
    console.error('Błąd pobierania produktów:', error);
    res.status(500).json({ error: 'Nie udało się pobrać produktów' });
  }
});

// GET /api/products/:id - Pobierz pojedynczy produkt po ID
productsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ error: 'Produkt nie został znaleziony' });
    }

    res.json(formatProduct(product));
  } catch (error) {
    console.error('Błąd pobierania produktu:', error);
    res.status(500).json({ error: 'Nie udało się pobrać szczegółów produktu' });
  }
});

// POST /api/products - Dodaj nowy produkt
productsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { id, title, description, price, brand, gender, colors, sizes, imageUrl } = req.body;

    if (!id || !title || !price || !brand || !gender || !imageUrl) {
      return res.status(400).json({ error: 'Wszystkie wymagane pola muszą być uzupełnione' });
    }

    const newProduct = await prisma.product.create({
      data: {
        id,
        title,
        description: description || '',
        price: Number(price),
        brand,
        gender,
        colors: Array.isArray(colors) ? JSON.stringify(colors) : JSON.stringify([]),
        sizes: Array.isArray(sizes) ? JSON.stringify(sizes) : JSON.stringify([]),
        imageUrl,
      },
    });

    res.status(201).json(formatProduct(newProduct));
  } catch (error) {
    console.error('Błąd dodawania produktu:', error);
    res.status(500).json({ error: 'Nie udało się dodać produktu' });
  }
});

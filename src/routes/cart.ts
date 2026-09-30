import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

export const cartRouter = Router();

function formatCartItem(item: any) {
  return {
    id: item.id,
    productId: item.productId,
    selectedColor: item.selectedColor,
    selectedSize: item.selectedSize,
    quantity: item.quantity,
    product: {
      ...item.product,
      colors: typeof item.product.colors === 'string' ? JSON.parse(item.product.colors) : item.product.colors,
      sizes: typeof item.product.sizes === 'string' ? JSON.parse(item.product.sizes) : item.product.sizes,
    },
  };
}

// GET /api/cart - Pobierz zawartość koszyka
cartRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const items = await prisma.cartItem.findMany({
      include: { product: true },
      orderBy: { createdAt: 'asc' },
    });

    const formattedItems = items.map(formatCartItem);
    const totalPrice = formattedItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    res.json({
      items: formattedItems,
      totalPrice: Number(totalPrice.toFixed(2)),
      totalItems: formattedItems.reduce((sum, item) => sum + item.quantity, 0),
    });
  } catch (error) {
    console.error('Błąd pobierania koszyka:', error);
    res.status(500).json({ error: 'Nie udało się pobrać koszyka' });
  }
});

// POST /api/cart - Dodaj przedmiot do koszyka
cartRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { productId, selectedColor, selectedSize, quantity = 1 } = req.body;

    if (!productId || !selectedColor || !selectedSize) {
      return res.status(400).json({ error: 'Brak wymaganych parametrów (productId, selectedColor, selectedSize)' });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: 'Wybrany produkt nie istnieje' });
    }

    // Sprawdź czy taki przedmiot z tym samym rozmiarem i kolorem jest już w koszyku
    const existing = await prisma.cartItem.findFirst({
      where: {
        productId,
        selectedColor,
        selectedSize,
      },
    });

    let resultItem;
    if (existing) {
      resultItem = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + Number(quantity) },
        include: { product: true },
      });
    } else {
      resultItem = await prisma.cartItem.create({
        data: {
          productId,
          selectedColor,
          selectedSize,
          quantity: Number(quantity),
        },
        include: { product: true },
      });
    }

    res.status(201).json(formatCartItem(resultItem));
  } catch (error) {
    console.error('Błąd dodawania do koszyka:', error);
    res.status(500).json({ error: 'Nie udało się dodać produktu do koszyka' });
  }
});

// PUT /api/cart/:id - Zmień ilość sztuk w koszyku
cartRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { quantity } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Nieprawidłowe ID elementu' });
    }

    if (Number(quantity) <= 0) {
      await prisma.cartItem.delete({ where: { id } });
      return res.json({ message: 'Usunięto z koszyka' });
    }

    const updated = await prisma.cartItem.update({
      where: { id },
      data: { quantity: Number(quantity) },
      include: { product: true },
    });

    res.json(formatCartItem(updated));
  } catch (error) {
    console.error('Błąd aktualizacji koszyka:', error);
    res.status(500).json({ error: 'Nie udało się zaktualizować pozycji w koszyku' });
  }
});

// DELETE /api/cart/:id - Usuń konkretny element z koszyka
cartRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Nieprawidłowe ID elementu' });
    }

    await prisma.cartItem.delete({
      where: { id },
    });

    res.json({ message: 'Element usunięty z koszyka' });
  } catch (error) {
    console.error('Błąd usuwania z koszyka:', error);
    res.status(500).json({ error: 'Nie udało się usunąć elementu' });
  }
});

// DELETE /api/cart - Wyczyść cały koszyk
cartRouter.delete('/', async (_req: Request, res: Response) => {
  try {
    await prisma.cartItem.deleteMany();
    res.json({ message: 'Koszyk został wyczyszczony' });
  } catch (error) {
    console.error('Błąd czyszczenia koszyka:', error);
    res.status(500).json({ error: 'Nie udało się wyczyścić koszyka' });
  }
});

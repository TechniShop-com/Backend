import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

export const ordersRouter = Router();

function formatOrder(order: any) {
  return {
    ...order,
    items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
  };
}

// GET /api/orders - Pobierz listę wszystkich zamówień
ordersRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders.map(formatOrder));
  } catch (error) {
    console.error('Błąd pobierania zamówień:', error);
    res.status(500).json({ error: 'Nie udało się pobrać zamówień' });
  }
});

// GET /api/orders/:id - Pobierz szczegóły zamówienia po ID
ordersRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Nieprawidłowe ID zamówienia' });
    }

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({ error: 'Zamówienie nie zostało znalezione' });
    }

    res.json(formatOrder(order));
  } catch (error) {
    console.error('Błąd pobierania zamówienia:', error);
    res.status(500).json({ error: 'Nie udało się pobrać zamówienia' });
  }
});

// POST /api/orders - Złóż nowe zamówienie
ordersRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, customerName, email, address, paymentMethod, totalPrice, items } = req.body;
    const finalName = customerName || name;

    if (!finalName || !email || !address || !items) {
      return res.status(400).json({ error: 'Wymagane dane zamawiającego oraz pozycje zamówienia' });
    }

    const newOrder = await prisma.order.create({
      data: {
        customerName: finalName,
        email,
        address,
        paymentMethod: paymentMethod || 'BLIK / Karta Online',
        totalPrice: Number(totalPrice) || 0,
        items: typeof items === 'string' ? items : JSON.stringify(items),
        status: 'PENDING',
      },
    });

    res.status(201).json(formatOrder(newOrder));
  } catch (error) {
    console.error('Błąd składania zamówienia:', error);
    res.status(500).json({ error: 'Nie udało się złożyć zamówienia' });
  }
});

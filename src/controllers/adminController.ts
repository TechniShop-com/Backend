import { Request, Response } from 'express';
import { prisma } from '../db';

export const getAdminOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fulfillmentStatus, paymentStatus, search } = req.query;

    const where: any = {};

    if (fulfillmentStatus && fulfillmentStatus !== 'ALL') {
      where.fulfillmentStatus = fulfillmentStatus as string;
    }

    if (paymentStatus && paymentStatus !== 'ALL') {
      where.paymentStatus = paymentStatus as string;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string } },
        { customerEmail: { contains: search as string } },
        { customerLastName: { contains: search as string } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
        schoolLocation: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        claims: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania zamówień w panelu admina' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { fulfillmentStatus, paymentStatus, note } = req.body;

    const currentOrder = await prisma.order.findUnique({ where: { id } });
    if (!currentOrder) {
      res.status(404).json({ error: 'Zamówienie nie istnieje' });
      return;
    }

    const updateData: any = {};
    if (fulfillmentStatus) updateData.fulfillmentStatus = fulfillmentStatus as string;
    if (paymentStatus) updateData.paymentStatus = paymentStatus as string;

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: updateData,
      });

      if (fulfillmentStatus && fulfillmentStatus !== currentOrder.fulfillmentStatus) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            previousStatus: currentOrder.fulfillmentStatus,
            newStatus: fulfillmentStatus as string,
            changedBy: 'Obsługa Sklepu',
            note: note || `Zmiana statusu realizacji na ${fulfillmentStatus}`,
          },
        });
      }

      return order;
    });

    res.json({ message: 'Zaktualizowano status zamówienia', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ error: 'Błąd aktualizacji statusu zamówienia' });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, brand, category, imageUrl, variants } = req.body;

    if (!title || !description || !variants || !variants.length) {
      res.status(400).json({ error: 'Brak wymaganych danych produktu lub wariantów' });
      return;
    }

    const newProduct = await prisma.product.create({
      data: {
        title,
        description,
        brand: brand || 'BOTH',
        category: category || 'Odzież',
        imageUrl: imageUrl || null,
        variants: {
          create: variants.map((v: any, index: number) => ({
            sku: v.sku || `SKU-${Date.now()}-${index}`,
            size: v.size || null,
            color: v.color || null,
            price: parseFloat(v.price),
            stock: parseInt(v.stock, 10) || 0,
            imageUrl: v.imageUrl || null,
          })),
        },
      },
      include: { variants: true },
    });

    res.status(201).json({ message: 'Produkt został utworzony', product: newProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Błąd podczas tworzenia produktu' });
  }
};

export const updateVariantStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { variantId } = req.params;
    const { stock, price } = req.body;

    const data: any = {};
    if (stock !== undefined) data.stock = parseInt(stock, 10);
    if (price !== undefined) data.price = parseFloat(price);

    const updatedVariant = await prisma.productVariant.update({
      where: { id: variantId },
      data,
    });

    res.json({ message: 'Wariant zaktualizowany', variant: updatedVariant });
  } catch (error) {
    res.status(500).json({ error: 'Błąd aktualizacji wariantu' });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
    res.json({ message: 'Produkt został ukryty / usunięty' });
  } catch (error) {
    res.status(500).json({ error: 'Błąd usuwania produktu' });
  }
};

export const getClaims = async (_req: Request, res: Response): Promise<void> => {
  try {
    const claims = await prisma.claim.findMany({
      include: {
        order: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(claims);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania zgłoszeń' });
  }
};

export const updateClaimStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const claim = await prisma.claim.update({
      where: { id },
      data: {
        status: status as string,
        adminNote: adminNote || null,
      },
    });

    res.json({ message: 'Zaktualizowano status zgłoszenia', claim });
  } catch (error) {
    res.status(500).json({ error: 'Błąd aktualizacji zgłoszenia' });
  }
};

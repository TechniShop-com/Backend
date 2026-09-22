import { Request, Response } from 'express';
import { prisma } from '../db';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      customerEmail,
      customerPhone,
      customerFirstName,
      customerLastName,
      deliveryMethod,
      deliveryAddress,
      paczkomatCode,
      schoolLocationId,
      items,
      discountCode,
      wantsInvoice,
      invoiceNip,
      invoiceCompanyName,
      invoiceAddress,
      notes,
    } = req.body;

    if (!customerEmail || !customerFirstName || !customerLastName || !items || !items.length) {
      res.status(400).json({ error: 'Uzupełnij wymagane dane i przedmioty w koszyku' });
      return;
    }

    // 1. Verify stock & prices
    let itemsTotal = 0;
    const validatedItems: Array<{
      productId: string;
      variantId: string;
      productName: string;
      variantInfo: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = [];

    for (const item of items) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: true },
      });

      if (!variant || !variant.product || !variant.product.isActive) {
        res.status(400).json({ error: `Wariant produktu o ID ${item.variantId} jest niedostępny` });
        return;
      }

      if (variant.stock < item.quantity) {
        res.status(400).json({
          error: `Produkt ${variant.product.title} (${variant.size || ''} ${variant.color || ''}) nie posiada wystarczającej ilości w magazynie (dostępne: ${variant.stock})`,
        });
        return;
      }

      const itemTotalPrice = variant.price * item.quantity;
      itemsTotal += itemTotalPrice;

      validatedItems.push({
        productId: variant.productId,
        variantId: variant.id,
        productName: variant.product.title,
        variantInfo: [variant.size, variant.color].filter(Boolean).join(' / '),
        quantity: item.quantity,
        unitPrice: variant.price,
        totalPrice: itemTotalPrice,
      });
    }

    // 2. Validate discount
    let discountAmount = 0;
    if (discountCode) {
      const disc = await prisma.discountCode.findUnique({
        where: { code: discountCode.trim().toUpperCase() },
      });
      if (disc && disc.isActive) {
        if (disc.discountPercent) {
          discountAmount = (itemsTotal * disc.discountPercent) / 100;
        } else if (disc.discountAmount) {
          discountAmount = disc.discountAmount;
        }
        await prisma.discountCode.update({
          where: { id: disc.id },
          data: { usageCount: { increment: 1 } },
        });
      }
    }

    // 3. Delivery cost
    let deliveryCost = 0;
    if (deliveryMethod === 'COURIER') {
      deliveryCost = 14.99;
    } else if (deliveryMethod === 'PACZKOMAT') {
      deliveryCost = 11.99;
    } else if (deliveryMethod === 'SCHOOL_PICKUP') {
      deliveryCost = 0;
    }

    const finalAmount = Math.max(0, itemsTotal - discountAmount) + deliveryCost;

    // 4. Generate order number
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `TS-${new Date().getFullYear()}-${randomSuffix}`;

    // 5. Create Order & decrement stock in transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      for (const vItem of validatedItems) {
        await tx.productVariant.update({
          where: { id: vItem.variantId },
          data: { stock: { decrement: vItem.quantity } },
        });
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerEmail,
          customerPhone: customerPhone || '',
          customerFirstName,
          customerLastName,
          deliveryMethod: deliveryMethod || 'COURIER',
          deliveryAddress: deliveryAddress || null,
          paczkomatCode: paczkomatCode || null,
          schoolLocationId: schoolLocationId || null,
          totalAmount: itemsTotal,
          discountAmount,
          deliveryCost,
          finalAmount,
          paymentStatus: 'PENDING',
          fulfillmentStatus: 'NEW',
          wantsInvoice: !!wantsInvoice,
          invoiceNip: invoiceNip || null,
          invoiceCompanyName: invoiceCompanyName || null,
          invoiceAddress: invoiceAddress || null,
          notes: notes || null,
          items: {
            create: validatedItems,
          },
          statusHistory: {
            create: {
              previousStatus: null,
              newStatus: 'NEW',
              changedBy: 'System',
              note: 'Utworzono zamówienie w sklepie TechniShop',
            },
          },
        },
        include: {
          items: true,
          schoolLocation: true,
        },
      });

      return order;
    });

    res.status(201).json({
      message: 'Zamówienie zostało pomyślnie złożone',
      order: newOrder,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Błąd podczas tworzenia zamówienia' });
  }
};

export const getOrderByNumber = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderNumber } = req.params;
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        schoolLocation: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        claims: true,
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Nie znaleziono zamówienia o podanym numerze' });
      return;
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania informacji o zamówieniu' });
  }
};

export const submitClaim = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderNumber, email, type, reason } = req.body;

    if (!orderNumber || !email || !type || !reason) {
      res.status(400).json({ error: 'Wypełnij wszystkie pola zgłoszenia' });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order || order.customerEmail.toLowerCase() !== email.trim().toLowerCase()) {
      res.status(404).json({ error: 'Nie znaleziono zamówienia pasującego do podanych danych' });
      return;
    }

    const claim = await prisma.claim.create({
      data: {
        orderId: order.id,
        type: type === 'RETURN' ? 'RETURN' : 'COMPLAINT',
        reason,
      },
    });

    res.status(201).json({
      message: 'Zgłoszenie zostało wysłane i przyjęte do rozpatrzenia',
      claim,
    });
  } catch (error) {
    res.status(500).json({ error: 'Błąd przesyłania zgłoszenia zwrotu/reklamacji' });
  }
};

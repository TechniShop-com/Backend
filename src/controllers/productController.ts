import { Request, Response } from 'express';
import { prisma } from '../db';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { brand, category, search, sort } = req.query;

    const where: any = {
      isActive: true,
    };

    if (brand && brand !== 'ALL') {
      where.OR = [
        { brand: brand as string },
        { brand: 'BOTH' },
      ];
    }

    if (category && category !== 'ALL') {
      where.category = category as string;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price_asc') {
      orderBy = { variants: { _count: 'desc' } }; // Basic ordering
    } else if (sort === 'price_desc') {
      orderBy = { createdAt: 'desc' };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        variants: true,
      },
      orderBy,
    });

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Nie udało się pobrać produktów' });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
      },
    });

    if (!product) {
      res.status(404).json({ error: 'Produkt nie został znaleziony' });
      return;
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania produktu' });
  }
};

export const getSchoolLocations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const locations = await prisma.schoolLocation.findMany({
      where: { isActive: true },
    });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania punktów odbioru' });
  }
};

export const validateDiscountCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, cartTotal } = req.body;
    if (!code) {
      res.status(400).json({ error: 'Brak kodu rabatowego' });
      return;
    }

    const discount = await prisma.discountCode.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!discount || !discount.isActive) {
      res.status(404).json({ error: 'Nieprawidłowy lub nieaktywny kod rabatowy' });
      return;
    }

    if (discount.validUntil && new Date() > discount.validUntil) {
      res.status(400).json({ error: 'Kod rabatowy wygasł' });
      return;
    }

    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
      res.status(400).json({ error: 'Wykorzystano limit użyć tego kodu' });
      return;
    }

    if (discount.minCartValue && cartTotal < discount.minCartValue) {
      res.status(400).json({
        error: `Minimalna wartość koszyka dla tego kodu to ${discount.minCartValue.toFixed(2)} zł`,
      });
      return;
    }

    let calculatedDiscount = 0;
    if (discount.discountPercent) {
      calculatedDiscount = (cartTotal * discount.discountPercent) / 100;
    } else if (discount.discountAmount) {
      calculatedDiscount = discount.discountAmount;
    }

    res.json({
      code: discount.code,
      discountAmount: Math.min(calculatedDiscount, cartTotal),
      discountPercent: discount.discountPercent,
    });
  } catch (error) {
    res.status(500).json({ error: 'Błąd podczas walidacji kodu rabatowego' });
  }
};

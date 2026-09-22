import { Request, Response } from 'express';
import { prisma } from '../db';
import { PaymentStatus } from '@prisma/client';

export const confirmPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, status } = req.body; // status: 'PAID' | 'FAILED'

    if (!orderId || !status) {
      res.status(400).json({ error: 'Brak id zamówienia lub statusu płatności' });
      return;
    }

    const newPaymentStatus = status === 'PAID' ? PaymentStatus.PAID : PaymentStatus.FAILED;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: newPaymentStatus,
      },
    });

    res.json({
      message: `Status płatności został zmieniony na: ${newPaymentStatus}`,
      order,
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Błąd podczas aktualizacji płatności' });
  }
};

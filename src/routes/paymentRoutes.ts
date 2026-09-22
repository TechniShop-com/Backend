import { Router } from 'express';
import { confirmPayment } from '../controllers/paymentController';

const router = Router();

router.post('/confirm', confirmPayment);

export default router;

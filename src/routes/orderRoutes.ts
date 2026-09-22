import { Router } from 'express';
import { createOrder, getOrderByNumber, submitClaim } from '../controllers/orderController';

const router = Router();

router.post('/', createOrder);
router.get('/:orderNumber', getOrderByNumber);
router.post('/claim', submitClaim);

export default router;

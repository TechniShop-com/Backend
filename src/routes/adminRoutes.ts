import { Router } from 'express';
import {
  getAdminOrders,
  updateOrderStatus,
  createProduct,
  updateVariantStock,
  deleteProduct,
  getClaims,
  updateClaimStatus,
} from '../controllers/adminController';

const router = Router();

router.get('/orders', getAdminOrders);
router.patch('/orders/:id/status', updateOrderStatus);

router.post('/products', createProduct);
router.patch('/products/variants/:variantId', updateVariantStock);
router.delete('/products/:id', deleteProduct);

router.get('/claims', getClaims);
router.patch('/claims/:id', updateClaimStatus);

export default router;

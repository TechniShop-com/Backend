import { Router } from 'express';
import {
  getProducts,
  getProductById,
  getSchoolLocations,
  validateDiscountCode,
} from '../controllers/productController';

const router = Router();

router.get('/', getProducts);
router.get('/locations', getSchoolLocations);
router.post('/validate-discount', validateDiscountCode);
router.get('/:id', getProductById);

export default router;

import { Router } from 'express';
import { 
  placeOrder, 
  getOrders, 
  getUserOrders, 
  getOrderById,
  updateOrderStatus, 
  getCoupons, 
  createCoupon,
  updateOrderItems,
  updateOrderLocation
} from '../controllers/orderController';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

// Placing order supports both authenticated customers and anonymous table guests (table QR order session)
// For table session, req.user will be empty, which our placeOrder handles gracefully.
router.post('/', (req, res, next) => {
  if (req.headers.authorization) {
    return authenticateJWT(req, res, next);
  }
  next();
}, placeOrder);

router.get('/', authenticateJWT, authorizeRoles(['admin', 'manager', 'kitchen', 'delivery']), getOrders);
router.get('/user', authenticateJWT, getUserOrders);
router.get('/:id', getOrderById);
router.put('/:id', (req, res, next) => {
  if (req.headers.authorization) {
    return authenticateJWT(req, res, next);
  }
  next();
}, updateOrderItems);
router.put('/:id/status', authenticateJWT, authorizeRoles(['admin', 'manager', 'kitchen', 'delivery']), updateOrderStatus);
router.put('/:id/location', authenticateJWT, authorizeRoles(['admin', 'delivery']), updateOrderLocation);
router.get('/coupons/all', getCoupons);
router.post('/coupons', authenticateJWT, authorizeRoles(['admin', 'manager']), createCoupon);

export default router;

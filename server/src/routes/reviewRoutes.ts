import { Router } from 'express';
import { 
  getReviews, 
  getPublicApprovedReviews, 
  createReview, 
  approveReview 
} from '../controllers/reviewController';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

// Public route to get approved reviews for landing page
router.get('/public', getPublicApprovedReviews);

// Authenticated or guest route to write a review
router.post('/', (req, res, next) => {
  if (req.headers.authorization) {
    return authenticateJWT(req, res, next);
  }
  next();
}, createReview);

// Admin / Manager routes to list and approve reviews
router.get('/', authenticateJWT, authorizeRoles(['admin', 'manager']), getReviews);
router.put('/:id/approve', authenticateJWT, authorizeRoles(['admin', 'manager']), approveReview);

export default router;

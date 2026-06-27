import { Router } from 'express';
import { getDashboardStats, getAIForecasts } from '../controllers/analyticsController';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

router.get('/dashboard', authenticateJWT, authorizeRoles(['admin', 'manager']), getDashboardStats);
router.get('/forecasting', authenticateJWT, authorizeRoles(['admin', 'manager']), getAIForecasts);

export default router;

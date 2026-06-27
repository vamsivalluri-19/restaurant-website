import { Router } from 'express';
import { getFoods, createFood, updateFood, deleteFood } from '../controllers/foodController';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getFoods);
router.post('/', authenticateJWT, authorizeRoles(['admin', 'manager']), createFood);
router.put('/:id', authenticateJWT, authorizeRoles(['admin', 'manager']), updateFood);
router.delete('/:id', authenticateJWT, authorizeRoles(['admin', 'manager']), deleteFood);

export default router;

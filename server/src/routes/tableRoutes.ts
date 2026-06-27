import { Router } from 'express';
import { 
  getTables, 
  getTableByNumber, 
  updateTableStatus, 
  reserveTable, 
  getReservations 
} from '../controllers/tableController';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getTables);
router.get('/:number', getTableByNumber);
router.put('/:number/status', authenticateJWT, authorizeRoles(['admin', 'manager', 'kitchen']), updateTableStatus);
router.post('/reserve', reserveTable);
router.get('/reservations/all', authenticateJWT, authorizeRoles(['admin', 'manager']), getReservations);

export default router;

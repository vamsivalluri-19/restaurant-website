import { Router } from 'express';
import { 
  registerUser, 
  loginUser, 
  verifyOTP, 
  forgotPassword, 
  resetPassword, 
  refreshToken,
  getUsers
} from '../controllers/authController';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh-token', refreshToken);
router.get('/users', authenticateJWT, authorizeRoles(['admin', 'manager']), getUsers);

export default router;

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { isMockDB, usersList } from '../utils/mockDbStore';
import { User } from '../models/User';

export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    name: string;
    email: string;
    role: 'customer' | 'admin' | 'manager' | 'kitchen' | 'delivery';
  };
}

export const authenticateJWT = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'supersecretjwtkeyforpakkamilitaryhotel123';

    jwt.verify(token, secret, async (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({ message: 'Forbidden: Invalid or expired token' });
      }

      if (isMockDB) {
        const found = usersList.find((u) => u._id === decoded.id);
        if (found) {
          req.user = { _id: found._id, name: found.name, email: found.email, role: found.role };
          return next();
        }
      } else {
        try {
          const found = await User.findById(decoded.id);
          if (found) {
            req.user = { _id: found._id.toString(), name: found.name, email: found.email, role: found.role as any };
            return next();
          }
        } catch (dbErr) {
          return res.status(500).json({ message: 'Internal server error during authentication' });
        }
      }

      return res.status(401).json({ message: 'Unauthorized: User not found' });
    });
  } else {
    res.status(401).json({ message: 'Unauthorized: Token missing' });
  }
};

export const authorizeRoles = (roles: Array<'customer' | 'admin' | 'manager' | 'kitchen' | 'delivery'>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to access this resource' });
    }

    next();
  };
};

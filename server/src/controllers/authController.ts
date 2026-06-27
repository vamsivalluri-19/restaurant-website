import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { isMockDB, usersList, UserType } from '../utils/mockDbStore';
import { User } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforpakkamilitaryhotel123';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecretrefreshjwtkeyforpakkamilitaryhotel456';

// Helper to generate tokens
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ id: userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }

    const assignedRole = role || 'customer';

    if (isMockDB) {
      const exists = usersList.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Hash password using plain or bcrypt (we'll store it directly for easy check or use simple hash)
      const newUser: UserType = {
        _id: 'u' + (usersList.length + 1),
        name,
        email: email.toLowerCase(),
        passwordHash: password, // simple store in mock
        role: assignedRole,
        isVerified: true, // Auto verify in mock
        phone,
        loyaltyPoints: 0
      };
      usersList.push(newUser);

      const tokens = generateTokens(newUser._id);
      return res.status(201).json({
        message: 'Registration successful (Mock DB)',
        user: { _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, loyaltyPoints: 0 },
        ...tokens
      });
    } else {
      const exists = await User.findOne({ email: email.toLowerCase() });
      if (exists) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser = new User({
        name,
        email: email.toLowerCase(),
        passwordHash,
        phone,
        role: assignedRole,
        isVerified: false // Requires OTP/verification
      });

      await newUser.save();

      const tokens = generateTokens(newUser._id.toString());
      return res.status(201).json({
        message: 'Registration successful. Verification email sent (Simulated).',
        user: { _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, loyaltyPoints: 0 },
        ...tokens
      });
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    if (isMockDB) {
      const user = usersList.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check simple password for mock
      const isMatch = user.passwordHash === password;
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const tokens = generateTokens(user._id);
      return res.json({
        message: 'Login successful (Mock DB)',
        user: { _id: user._id, name: user.name, email: user.email, role: user.role, loyaltyPoints: user.loyaltyPoints },
        ...tokens
      });
    } else {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const tokens = generateTokens(user._id.toString());
      return res.json({
        message: 'Login successful',
        user: { _id: user._id, name: user.name, email: user.email, role: user.role, loyaltyPoints: user.loyaltyPoints },
        ...tokens
      });
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  // Simulating successful verification
  return res.json({ message: 'OTP verified successfully. Account activated.' });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  return res.json({ message: 'Reset password link sent to your email.' });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  return res.json({ message: 'Password reset successful.' });
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh Token required' });
  }

  try {
    const decoded: any = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const tokens = generateTokens(decoded.id);
    return res.json(tokens);
  } catch (err) {
    return res.status(403).json({ message: 'Invalid refresh token' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    if (isMockDB) {
      return res.json(usersList);
    } else {
      const users = await User.find().sort({ createdAt: -1 });
      return res.json(users);
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

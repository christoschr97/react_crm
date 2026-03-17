import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({ error: 'Account is deactivated' });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatch) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const secret = process.env.JWT_SECRET ?? 'change_me_in_production';

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
});

export default router;

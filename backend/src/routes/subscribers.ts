import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// POST /api/subscribers — public, no auth
router.post('/', async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: 'email is required' });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }

  const existing = await prisma.subscriber.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email already subscribed' });
    return;
  }

  const subscriber = await prisma.subscriber.create({
    data: { email },
    select: { id: true, email: true, createdAt: true },
  });

  res.status(201).json(subscriber);
});

// GET /api/subscribers — admin only
router.get('/', requireAuth, async (_req: Request, res: Response) => {
  const subscribers = await prisma.subscriber.findMany({
    select: { id: true, email: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json(subscribers);
});

export default router;

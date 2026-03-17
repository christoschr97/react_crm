import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All user routes require authentication
router.use(requireAuth);

// GET /api/users?search=&role=&isActive=
router.get('/', async (req: Request, res: Response) => {
  const { search, role, isActive } = req.query;

  const users = await prisma.user.findMany({
    where: {
      ...(search
        ? {
            OR: [
              { name: { contains: String(search), mode: 'insensitive' } },
              { email: { contains: String(search), mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(role ? { role: role as 'ADMIN' | 'EDITOR' } : {}),
      ...(isActive !== undefined ? { isActive: isActive === 'true' } : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(users);
});

// POST /api/users
router.post('/', async (req: Request, res: Response) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ error: 'email, password and name are required' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email already in use' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, passwordHash, name, role: role ?? 'EDITOR' },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
  });

  res.status(201).json(user);
});

// PATCH /api/users/:id
router.patch('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, email, password, role, isActive } = req.body;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(password !== undefined && { passwordHash: await bcrypt.hash(password, 10) }),
      ...(role !== undefined && { role }),
      ...(isActive !== undefined && { isActive }),
    },
    select: { id: true, email: true, name: true, role: true, isActive: true, updatedAt: true },
  });

  res.json(user);
});

// DELETE /api/users/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  await prisma.user.delete({ where: { id } });
  res.status(204).send();
});

export default router;

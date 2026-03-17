import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(requireAuth);

// GET /api/posts?search=&categoryId=
router.get('/', async (req: Request, res: Response) => {
  const { search, categoryId } = req.query;

  const posts = await prisma.post.findMany({
    where: {
      ...(search
        ? {
            OR: [
              { title: { contains: String(search), mode: 'insensitive' } },
              { content: { contains: String(search), mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(categoryId ? { categoryId: Number(categoryId) } : {}),
    },
    include: {
      author: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(posts);
});

// GET /api/posts/:id
router.get('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
  });

  if (!post) {
    res.status(404).json({ error: 'Post not found' });
    return;
  }

  res.json(post);
});

// POST /api/posts
router.post('/', async (req: Request, res: Response) => {
  const { title, content, categoryId } = req.body;

  if (!title || !content || !categoryId) {
    res.status(400).json({ error: 'title, content and categoryId are required' });
    return;
  }

  const category = await prisma.category.findUnique({ where: { id: Number(categoryId) } });
  if (!category) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  const post = await prisma.post.create({
    data: {
      title,
      content,
      categoryId: Number(categoryId),
      authorId: req.user!.userId,
    },
    include: {
      author: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
  });

  res.status(201).json(post);
});

// PATCH /api/posts/:id
router.patch('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, content, categoryId } = req.body;

  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: 'Post not found' });
    return;
  }

  if (categoryId) {
    const category = await prisma.category.findUnique({ where: { id: Number(categoryId) } });
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
  }

  const post = await prisma.post.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(categoryId !== undefined && { categoryId: Number(categoryId) }),
    },
    include: {
      author: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
  });

  res.json(post);
});

// DELETE /api/posts/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: 'Post not found' });
    return;
  }

  await prisma.post.delete({ where: { id } });
  res.status(204).send();
});

export default router;

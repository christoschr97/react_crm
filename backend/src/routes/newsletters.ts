import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(requireAuth);

const newsletterInclude = {
  sections: {
    orderBy: { order: 'asc' as const },
    include: {
      category: { select: { id: true, name: true } },
      posts: {
        include: {
          post: {
            include: {
              author: { select: { id: true, name: true } },
              category: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  },
};

// GET /api/newsletters
router.get('/', async (_req: Request, res: Response) => {
  const newsletters = await prisma.newsletter.findMany({
    orderBy: { createdAt: 'desc' },
    include: newsletterInclude,
  });
  res.json(newsletters);
});

// GET /api/newsletters/:id
router.get('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const newsletter = await prisma.newsletter.findUnique({
    where: { id },
    include: newsletterInclude,
  });

  if (!newsletter) {
    res.status(404).json({ error: 'Newsletter not found' });
    return;
  }

  res.json(newsletter);
});

// POST /api/newsletters
// Body: { title, sections: [{ categoryId, order }] } — expects exactly 3 sections
router.post('/', async (req: Request, res: Response) => {
  const { title, sections } = req.body;

  if (!title) {
    res.status(400).json({ error: 'title is required' });
    return;
  }

  if (!Array.isArray(sections) || sections.length !== 3) {
    res.status(400).json({ error: 'sections must be an array of exactly 3 items' });
    return;
  }

  const orders = sections.map((s: any) => s.order).sort();
  if (JSON.stringify(orders) !== JSON.stringify([1, 2, 3])) {
    res.status(400).json({ error: 'sections must have orders 1, 2 and 3' });
    return;
  }

  // Validate all categoryIds exist
  for (const section of sections) {
    const category = await prisma.category.findUnique({ where: { id: Number(section.categoryId) } });
    if (!category) {
      res.status(404).json({ error: `Category ${section.categoryId} not found` });
      return;
    }
  }

  const newsletter = await prisma.newsletter.create({
    data: {
      title,
      sections: {
        create: sections.map((s: any) => ({
          categoryId: Number(s.categoryId),
          order: Number(s.order),
        })),
      },
    },
    include: newsletterInclude,
  });

  res.status(201).json(newsletter);
});

// PATCH /api/newsletters/:id
router.patch('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title } = req.body;

  const existing = await prisma.newsletter.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: 'Newsletter not found' });
    return;
  }

  const newsletter = await prisma.newsletter.update({
    where: { id },
    data: { ...(title !== undefined && { title }) },
    include: newsletterInclude,
  });

  res.json(newsletter);
});

// POST /api/newsletters/:id/sections/:sectionId/posts
// Body: { postId }
router.post('/:id/sections/:sectionId/posts', async (req: Request, res: Response) => {
  const newsletterId = Number(req.params.id);
  const sectionId = Number(req.params.sectionId);
  const { postId } = req.body;

  if (!postId) {
    res.status(400).json({ error: 'postId is required' });
    return;
  }

  const section = await prisma.newsletterSection.findFirst({
    where: { id: sectionId, newsletterId },
  });
  if (!section) {
    res.status(404).json({ error: 'Section not found' });
    return;
  }

  const post = await prisma.post.findUnique({ where: { id: Number(postId) } });
  if (!post) {
    res.status(404).json({ error: 'Post not found' });
    return;
  }

  // Upsert so attaching the same post twice is idempotent
  await prisma.newsletterSectionPost.upsert({
    where: { sectionId_postId: { sectionId, postId: Number(postId) } },
    update: {},
    create: { sectionId, postId: Number(postId) },
  });

  const newsletter = await prisma.newsletter.findUnique({
    where: { id: newsletterId },
    include: newsletterInclude,
  });

  res.status(201).json(newsletter);
});

// DELETE /api/newsletters/:id/sections/:sectionId/posts/:postId
router.delete('/:id/sections/:sectionId/posts/:postId', async (req: Request, res: Response) => {
  const newsletterId = Number(req.params.id);
  const sectionId = Number(req.params.sectionId);
  const postId = Number(req.params.postId);

  const section = await prisma.newsletterSection.findFirst({
    where: { id: sectionId, newsletterId },
  });
  if (!section) {
    res.status(404).json({ error: 'Section not found' });
    return;
  }

  const link = await prisma.newsletterSectionPost.findUnique({
    where: { sectionId_postId: { sectionId, postId } },
  });
  if (!link) {
    res.status(404).json({ error: 'Post not attached to this section' });
    return;
  }

  await prisma.newsletterSectionPost.delete({
    where: { sectionId_postId: { sectionId, postId } },
  });

  res.status(204).send();
});

export default router;

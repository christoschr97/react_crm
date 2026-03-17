import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';

process.env.JWT_SECRET = 'test-secret';

vi.mock('@prisma/client', () => {
  const newsletter = { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() };
  const newsletterSection = { findFirst: vi.fn() };
  const newsletterSectionPost = { upsert: vi.fn(), findUnique: vi.fn(), delete: vi.fn() };
  const category = { findUnique: vi.fn() };
  const post = { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() };
  const user = { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() };
  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      newsletter, newsletterSection, newsletterSectionPost, category, post, user,
    })),
  };
});

vi.mock('bcryptjs', () => ({ default: { hash: vi.fn(), compare: vi.fn() } }));

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient() as any;

const token = `Bearer ${jwt.sign(
  { userId: 1, email: 'admin@crm.com', role: 'ADMIN' },
  'test-secret',
  { expiresIn: '1h' }
)}`;

const mockNewsletter = {
  id: 1,
  title: 'Weekly Digest',
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    { id: 1, newsletterId: 1, categoryId: 1, order: 1, category: { id: 1, name: 'Technology' }, posts: [] },
    { id: 2, newsletterId: 1, categoryId: 2, order: 2, category: { id: 2, name: 'Business' }, posts: [] },
    { id: 3, newsletterId: 1, categoryId: 3, order: 3, category: { id: 3, name: 'Design' }, posts: [] },
  ],
};

beforeEach(() => vi.clearAllMocks());

describe('GET /api/newsletters', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/newsletters');
    expect(res.status).toBe(401);
  });

  it('returns list of newsletters', async () => {
    db.newsletter.findMany.mockResolvedValue([mockNewsletter]);

    const res = await request(app).get('/api/newsletters').set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Weekly Digest');
    expect(res.body[0].sections).toHaveLength(3);
  });
});

describe('POST /api/newsletters', () => {
  const validBody = {
    title: 'Weekly Digest',
    sections: [
      { categoryId: 1, order: 1 },
      { categoryId: 2, order: 2 },
      { categoryId: 3, order: 3 },
    ],
  };

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/newsletters')
      .set('Authorization', token)
      .send({ sections: validBody.sections });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/i);
  });

  it('returns 400 when sections count is not 3', async () => {
    const res = await request(app)
      .post('/api/newsletters')
      .set('Authorization', token)
      .send({ title: 'Test', sections: [{ categoryId: 1, order: 1 }] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/3/);
  });

  it('returns 404 when a categoryId does not exist', async () => {
    db.category.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/newsletters')
      .set('Authorization', token)
      .send(validBody);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Category/);
  });

  it('creates newsletter with 3 sections and returns 201', async () => {
    db.category.findUnique.mockResolvedValue({ id: 1, name: 'Technology' });
    db.newsletter.create.mockResolvedValue(mockNewsletter);

    const res = await request(app)
      .post('/api/newsletters')
      .set('Authorization', token)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.sections).toHaveLength(3);
  });
});

describe('POST /api/newsletters/:id/sections/:sectionId/posts', () => {
  it('returns 404 when section does not belong to newsletter', async () => {
    db.newsletterSection.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/newsletters/1/sections/99/posts')
      .set('Authorization', token)
      .send({ postId: 1 });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Section not found');
  });

  it('attaches a post to a section', async () => {
    db.newsletterSection.findFirst.mockResolvedValue({ id: 1, newsletterId: 1 });
    db.post.findUnique.mockResolvedValue({ id: 1, title: 'Hello' });
    db.newsletterSectionPost.upsert.mockResolvedValue({});
    db.newsletter.findUnique.mockResolvedValue(mockNewsletter);

    const res = await request(app)
      .post('/api/newsletters/1/sections/1/posts')
      .set('Authorization', token)
      .send({ postId: 1 });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(1);
  });
});

describe('DELETE /api/newsletters/:id/sections/:sectionId/posts/:postId', () => {
  it('returns 404 when post is not attached to section', async () => {
    db.newsletterSection.findFirst.mockResolvedValue({ id: 1, newsletterId: 1 });
    db.newsletterSectionPost.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/newsletters/1/sections/1/posts/99')
      .set('Authorization', token);

    expect(res.status).toBe(404);
  });

  it('detaches a post and returns 204', async () => {
    db.newsletterSection.findFirst.mockResolvedValue({ id: 1, newsletterId: 1 });
    db.newsletterSectionPost.findUnique.mockResolvedValue({ sectionId: 1, postId: 1 });
    db.newsletterSectionPost.delete.mockResolvedValue({});

    const res = await request(app)
      .delete('/api/newsletters/1/sections/1/posts/1')
      .set('Authorization', token);

    expect(res.status).toBe(204);
  });
});

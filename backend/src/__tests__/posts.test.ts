import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';

process.env.JWT_SECRET = 'test-secret';

vi.mock('@prisma/client', () => {
  const post = {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const category = {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  };
  const user = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  return {
    PrismaClient: vi.fn().mockImplementation(() => ({ post, category, user })),
  };
});

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn(), compare: vi.fn() },
}));

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient() as any;

const token = `Bearer ${jwt.sign(
  { userId: 1, email: 'admin@crm.com', role: 'ADMIN' },
  'test-secret',
  { expiresIn: '1h' }
)}`;

const mockPost = {
  id: 1,
  title: 'Hello World',
  content: 'Some content',
  categoryId: 1,
  authorId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  author: { id: 1, name: 'Admin' },
  category: { id: 1, name: 'Technology' },
};

beforeEach(() => vi.clearAllMocks());

describe('GET /api/posts', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/posts');
    expect(res.status).toBe(401);
  });

  it('returns list of posts', async () => {
    db.post.findMany.mockResolvedValue([mockPost]);

    const res = await request(app).get('/api/posts').set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Hello World');
  });
});

describe('POST /api/posts', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', token)
      .send({ title: 'No category' });

    expect(res.status).toBe(400);
  });

  it('returns 404 when category does not exist', async () => {
    db.category.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', token)
      .send({ title: 'Post', content: 'Content', categoryId: 99 });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Category not found');
  });

  it('creates a post and returns 201', async () => {
    db.category.findUnique.mockResolvedValue({ id: 1, name: 'Technology' });
    db.post.create.mockResolvedValue(mockPost);

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', token)
      .send({ title: 'Hello World', content: 'Some content', categoryId: 1 });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Hello World');
    expect(res.body.category.name).toBe('Technology');
  });
});

describe('PATCH /api/posts/:id', () => {
  it('returns 404 when post does not exist', async () => {
    db.post.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/posts/999')
      .set('Authorization', token)
      .send({ title: 'Updated' });

    expect(res.status).toBe(404);
  });

  it('updates a post', async () => {
    db.post.findUnique.mockResolvedValue(mockPost);
    db.post.update.mockResolvedValue({ ...mockPost, title: 'Updated Title' });

    const res = await request(app)
      .patch('/api/posts/1')
      .set('Authorization', token)
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Title');
  });
});

describe('DELETE /api/posts/:id', () => {
  it('returns 404 when post does not exist', async () => {
    db.post.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/posts/999')
      .set('Authorization', token);

    expect(res.status).toBe(404);
  });

  it('deletes a post and returns 204', async () => {
    db.post.findUnique.mockResolvedValue(mockPost);
    db.post.delete.mockResolvedValue({});

    const res = await request(app)
      .delete('/api/posts/1')
      .set('Authorization', token);

    expect(res.status).toBe(204);
  });
});

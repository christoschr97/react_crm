import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Posts from '../pages/Posts';

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

import client from '../api/client';
const clientMock = client as any;

const mockCategories = [
  { id: 1, name: 'Technology' },
  { id: 2, name: 'Business' },
];

const mockPosts = [
  {
    id: 1,
    title: 'First Post',
    content: 'Content here',
    categoryId: 1,
    category: { id: 1, name: 'Technology' },
    author: { id: 1, name: 'Admin' },
    createdAt: '2026-03-17T00:00:00.000Z',
    updatedAt: '2026-03-17T00:00:00.000Z',
  },
];

function renderPosts() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Posts />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  clientMock.get.mockImplementation((url: string) => {
    if (url === '/categories') return Promise.resolve({ data: mockCategories });
    if (url === '/posts') return Promise.resolve({ data: mockPosts });
    return Promise.resolve({ data: [] });
  });
});

describe('Posts page', () => {
  it('renders the posts table with data', async () => {
    renderPosts();

    await waitFor(() => {
      expect(screen.getByText('First Post')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Technology').length).toBeGreaterThan(0);
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('opens create modal when clicking + New post', async () => {
    renderPosts();

    await waitFor(() => screen.getByText('First Post'));

    await userEvent.click(screen.getByRole('button', { name: /new post/i }));

    expect(screen.getByText('New post')).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
  });

  it('creates a post and closes the modal', async () => {
    const newPost = { ...mockPosts[0], id: 2, title: 'New Post' };
    clientMock.post.mockResolvedValue({ data: newPost });
    clientMock.get.mockImplementation((url: string) => {
      if (url === '/categories') return Promise.resolve({ data: mockCategories });
      if (url === '/posts') return Promise.resolve({ data: [...mockPosts, newPost] });
      return Promise.resolve({ data: [] });
    });

    renderPosts();
    await waitFor(() => screen.getByText('First Post'));

    await userEvent.click(screen.getByRole('button', { name: /new post/i }));
    await userEvent.type(screen.getByLabelText(/^title$/i), 'New Post');
    await userEvent.type(screen.getByLabelText(/^content$/i), 'Some content');
    await userEvent.click(screen.getByRole('button', { name: /^create$/i }));

    await waitFor(() => {
      expect(clientMock.post).toHaveBeenCalledWith('/posts', expect.objectContaining({ title: 'New Post' }));
    });
  });

  it('opens edit modal pre-filled with post data', async () => {
    renderPosts();
    await waitFor(() => screen.getByText('First Post'));

    const row = screen.getByText('First Post').closest('tr')!;
    await userEvent.click(within(row).getByRole('button', { name: /edit/i }));

    expect(screen.getByText('Edit post')).toBeInTheDocument();
    expect(screen.getByLabelText(/^title$/i)).toHaveValue('First Post');
    expect(screen.getByLabelText(/^content$/i)).toHaveValue('Content here');
  });

  it('deletes a post after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    clientMock.delete.mockResolvedValue({});

    renderPosts();
    await waitFor(() => screen.getByText('First Post'));

    const row = screen.getByText('First Post').closest('tr')!;
    await userEvent.click(within(row).getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(clientMock.delete).toHaveBeenCalledWith('/posts/1');
    });
  });
});

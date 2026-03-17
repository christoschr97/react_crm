import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from '../pages/Login';
import { AuthProvider } from '../auth/AuthContext';

// Mock the api client
vi.mock('../api/client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import client from '../api/client';
const clientMock = client as any;

function renderLogin() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => vi.clearAllMocks());

describe('Login page', () => {
  it('renders email and password fields', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('admin@crm.com')).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows error message on invalid credentials', async () => {
    clientMock.post.mockRejectedValue({
      response: { data: { error: 'Invalid credentials' } },
    });

    renderLogin();

    await userEvent.type(screen.getByPlaceholderText('admin@crm.com'), 'wrong@crm.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows error when account is deactivated', async () => {
    clientMock.post.mockRejectedValue({
      response: { data: { error: 'Account is deactivated' } },
    });

    renderLogin();

    await userEvent.type(screen.getByPlaceholderText('admin@crm.com'), 'inactive@crm.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'pass123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Account is deactivated')).toBeInTheDocument();
    });
  });

  it('navigates to /users on successful login', async () => {
    clientMock.post.mockResolvedValue({
      data: {
        token: 'fake-token',
        user: { id: 1, email: 'admin@crm.com', name: 'Admin', role: 'ADMIN' },
      },
    });

    renderLogin();

    await userEvent.type(screen.getByPlaceholderText('admin@crm.com'), 'admin@crm.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'admin123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/users');
    });
  });
});

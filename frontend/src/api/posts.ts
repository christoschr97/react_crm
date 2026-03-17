import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';

export interface Category {
  id: number;
  name: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  categoryId: number;
  category: Category;
  author: { id: number; name: string };
  createdAt: string;
  updatedAt: string;
}

export function usePosts(search?: string, categoryId?: number) {
  return useQuery({
    queryKey: ['posts', search, categoryId],
    queryFn: async () => {
      const { data } = await client.get<Post[]>('/posts', {
        params: { search, categoryId },
      });
      return data;
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await client.get<Category[]>('/categories');
      return data;
    },
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { title: string; content: string; categoryId: number }) =>
      client.post<Post>('/posts', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number; title?: string; content?: string; categoryId?: number }) =>
      client.patch<Post>(`/posts/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => client.delete(`/posts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}

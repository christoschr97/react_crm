import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';

export interface NewsletterSection {
  id: number;
  order: number;
  category: { id: number; name: string };
  posts: { post: { id: number; title: string; author: { name: string } } }[];
}

export interface Newsletter {
  id: number;
  title: string;
  createdAt: string;
  sections: NewsletterSection[];
}

export function useNewsletters() {
  return useQuery({
    queryKey: ['newsletters'],
    queryFn: async () => {
      const { data } = await client.get<Newsletter[]>('/newsletters');
      return data;
    },
  });
}

export function useCreateNewsletter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { title: string; sections: { categoryId: number; order: number }[] }) =>
      client.post<Newsletter>('/newsletters', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['newsletters'] }),
  });
}

export function useAttachPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ newsletterId, sectionId, postId }: { newsletterId: number; sectionId: number; postId: number }) =>
      client.post(`/newsletters/${newsletterId}/sections/${sectionId}/posts`, { postId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['newsletters'] }),
  });
}

export function useDetachPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ newsletterId, sectionId, postId }: { newsletterId: number; sectionId: number; postId: number }) =>
      client.delete(`/newsletters/${newsletterId}/sections/${sectionId}/posts/${postId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['newsletters'] }),
  });
}

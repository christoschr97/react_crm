import { useQuery, useMutation } from '@tanstack/react-query';
import client from './client';

export interface Subscriber {
  id: number;
  email: string;
  createdAt: string;
}

export function useSubscribers() {
  return useQuery({
    queryKey: ['subscribers'],
    queryFn: async () => {
      const { data } = await client.get<Subscriber[]>('/subscribers');
      return data;
    },
  });
}

export function useSubscribe() {
  return useMutation({
    mutationFn: (email: string) => client.post('/subscribers', { email }),
  });
}

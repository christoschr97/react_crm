import { useState, FormEvent } from 'react';
import { useSubscribe } from '../api/subscribers';

export default function Subscribe() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const subscribe = useSubscribe();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await subscribe.mutateAsync(email);
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Something went wrong');
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow p-8 w-full max-w-sm text-center">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Stay in the loop</h1>
        <p className="text-sm text-gray-500 mb-6">Subscribe to our newsletter and never miss an update.</p>

        {done ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-700 font-medium">You're subscribed!</p>
            <p className="text-green-600 text-sm mt-1">Thanks for signing up.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={subscribe.isPending}
              className="w-full bg-indigo-600 text-white rounded-md py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {subscribe.isPending ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

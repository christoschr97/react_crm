import { useSubscribers } from '../api/subscribers';

export default function Subscribers() {
  const { data: subscribers = [], isLoading } = useSubscribers();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Subscribers</h2>
        <span className="text-sm text-gray-500">{subscribers.length} total</span>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Email', 'Subscribed on'].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={2} className="px-6 py-4 text-sm text-gray-500">Loading…</td></tr>
            ) : subscribers.length === 0 ? (
              <tr><td colSpan={2} className="px-6 py-4 text-sm text-gray-500">No subscribers yet.</td></tr>
            ) : (
              subscribers.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{s.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

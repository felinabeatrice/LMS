import { useState, useEffect } from 'react';
import api from '../../api/axios';

const statusColor = (status) => {
  if (status === 'completed') return 'bg-green-100 text-green-700';
  if (status === 'pending')   return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
};

const ManagePayments = () => {
  const [payments,   setPayments]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [revenue,    setRevenue]    = useState(0);

  // Filters
  const [search,     setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Filtered result
  const filtered = payments.filter((p) => {
    const matchSearch =
      !search ||
      p.student?.name.toLowerCase().includes(search.toLowerCase()) ||
      p.student?.email.toLowerCase().includes(search.toLowerCase()) ||
      p.course?.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/payments');
        setPayments(res.data.payments || []);
        setRevenue(res.data.total_revenue || 0);
      } catch {
        setError('Failed to load payments.');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent
                        rounded-full animate-spin" />
      </div>
    );
  }

  const completedCount = payments.filter((p) => p.status === 'completed').length;
  const pendingCount   = payments.filter((p) => p.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">All Payments</h1>
          <p className="text-gray-500 text-sm mt-1">
            {payments.length} total transactions
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700
                          rounded-xl p-5 text-white">
            <div className="text-2xl font-bold">${revenue.toFixed(2)}</div>
            <div className="text-blue-100 text-sm mt-0.5">Total Revenue</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-2xl font-bold text-green-600">
              {completedCount}
            </div>
            <div className="text-gray-500 text-sm mt-0.5">
              Completed Payments
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-2xl font-bold text-amber-600">
              {pendingCount}
            </div>
            <div className="text-gray-500 text-sm mt-0.5">
              Pending Payments
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700
                          rounded-xl px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student, email or course..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg
                         text-sm focus:outline-none focus:ring-2
                         focus:ring-blue-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500
                         bg-white"
            >
              <option value="">All statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            {(search || statusFilter) && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                }}
                className="px-4 py-2.5 text-sm text-gray-500 border
                           border-gray-200 rounded-lg hover:bg-gray-50
                           transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          {filtered.length !== payments.length && (
            <p className="text-xs text-gray-400 mt-2">
              Showing {filtered.length} of {payments.length} payments
            </p>
          )}
        </div>

        {/* Table */}
        {payments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12
                          text-center">
            <div className="text-5xl mb-4">💳</div>
            <h3 className="font-semibold text-gray-700 mb-2">
              No payments yet
            </h3>
            <p className="text-gray-400 text-sm">
              Payments will appear here when students enroll in paid courses.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['ID', 'Student', 'Course', 'Amount',
                      'Status', 'Access', 'Date'].map((h) => (
                      <th key={h}
                        className="text-left px-5 py-3 text-xs font-semibold
                                   text-gray-500 uppercase tracking-wide
                                   whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7}
                        className="px-5 py-12 text-center text-gray-400 text-sm">
                        No payments match your filters
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => (
                      <tr key={p.id}
                        className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 text-xs text-gray-400">
                          #{p.id}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full
                                            bg-gradient-to-br from-green-400
                                            to-teal-500 flex items-center
                                            justify-center text-white text-xs
                                            font-bold flex-shrink-0">
                              {p.student?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900
                                              text-sm">
                                {p.student?.name}
                              </div>
                              <div className="text-xs text-gray-400">
                                {p.student?.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-900 text-sm
                                          max-w-[200px] truncate">
                            {p.course?.title}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-bold text-gray-900 text-sm">
                            ${parseFloat(p.amount).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full
                            font-medium capitalize
                            ${statusColor(p.status)}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full
                            font-medium
                            ${p.access_granted
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100   text-red-700'
                            }`}>
                            {p.access_granted ? '✅ Granted' : '❌ Locked'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-400
                                       whitespace-nowrap">
                          {new Date(p.created_at).toLocaleDateString('en-US', {
                            year:  'numeric',
                            month: 'short',
                            day:   'numeric',
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ManagePayments;
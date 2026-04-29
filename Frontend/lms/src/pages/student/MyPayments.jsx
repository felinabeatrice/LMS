import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const statusColor = (s) =>
  s === 'completed' ? 'bg-green-100 text-green-700' :
  s === 'pending' ? 'bg-amber-100 text-amber-700' :
  'bg-red-100 text-red-700';

const MyPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const res = await api.get('/payments/my-payments');
        const pays = res.data.payments || [];
        setPayments(pays);
        setTotal(
          pays.filter((p) => p.status === 'completed')
              .reduce((s, p) => s + parseFloat(p.amount), 0)
        );
      } catch {
        setError('Failed to load payment history.');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Payments</h1>
            <p className="text-gray-500 text-sm mt-1">
              {payments.length} transaction{payments.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-right">
            <p className="text-xs text-gray-500">Total Spent</p>
            <p className="text-lg font-bold text-gray-900">${total.toFixed(2)}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        {payments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">💳</div>
            <h3 className="font-semibold text-gray-700 mb-2">No payments yet</h3>
            <Link
              to="/courses"
              className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Course</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Access</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <Link
                        to={`/courses/${p.course_id}`}
                        className="font-medium text-gray-900 text-sm hover:text-blue-600 transition-colors"
                      >
                        {p.course?.title}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">
                        by {p.course?.instructor?.name}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-gray-900 text-sm">
                        ${parseFloat(p.amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColor(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${p.access_granted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.access_granted ? 'Granted' : 'Locked'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400">
                      {new Date(p.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPayments;
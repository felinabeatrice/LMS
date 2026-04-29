import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';

const StatCard = ({ icon, label, value, sub, color, to }) => {
  const content = (
    <div className="bg-white rounded-xl border border-gray-200 p-5
                    hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                       text-xl mb-3 ${color}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-0.5">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
      {sub && (
        <div className="text-xs text-gray-400 mt-1">{sub}</div>
      )}
    </div>
  );
  return to ? (
    <Link to={to} className="block">{content}</Link>
  ) : content;
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data.stats);
      } catch {
        setError('Failed to load dashboard stats.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent
                        rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ──────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <span className="bg-red-100 text-red-700 text-xs font-semibold
                             px-2.5 py-1 rounded-full">
              ADMIN
            </span>
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-gray-500 text-sm">
            Welcome back, {user?.name} — System overview
          </p>
        </div>

        {/* ── Error ───────────────────────────────────── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700
                          rounded-xl px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        {/* ── Stats Grid ──────────────────────────────── */}
        {stats && (
          <>
            {/* Users */}
            <h2 className="text-xs font-semibold text-gray-400 uppercase
                           tracking-wide mb-3">
              Users
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon="👥"
                label="Total Users"
                value={stats.users.total}
                color="bg-blue-50"
                to="/admin/users"
              />
              <StatCard
                icon="🎓"
                label="Students"
                value={stats.users.students}
                color="bg-green-50"
                to="/admin/users"
              />
              <StatCard
                icon="📚"
                label="Instructors"
                value={stats.users.instructors}
                color="bg-purple-50"
                to="/admin/users"
              />
              <StatCard
                icon="⏳"
                label="Pending Instructors"
                value={stats.users.pending_instructors}
                color="bg-amber-50"
                sub={
                  stats.users.pending_instructors > 0
                    ? 'Needs approval'
                    : 'All clear'
                }
                to="/admin/users"
              />
            </div>

            {/* Courses */}
            <h2 className="text-xs font-semibold text-gray-400 uppercase
                           tracking-wide mb-3">
              Courses
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon="📖"
                label="Total Courses"
                value={stats.courses.total}
                color="bg-blue-50"
              />
              <StatCard
                icon="✅"
                label="Approved"
                value={stats.courses.approved}
                color="bg-green-50"
              />
              <StatCard
                icon="🕐"
                label="Pending Review"
                value={stats.courses.pending}
                color="bg-amber-50"
                sub={
                  stats.courses.pending > 0
                    ? 'Action required'
                    : 'None pending'
                }
                to="/admin/courses/pending"
              />
              <StatCard
                icon="👨‍🎓"
                label="Total Enrollments"
                value={stats.enrollments}
                color="bg-indigo-50"
              />
            </div>

            {/* Revenue */}
            <h2 className="text-xs font-semibold text-gray-400 uppercase
                           tracking-wide mb-3">
              Revenue
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700
                              rounded-xl p-6 text-white">
                <div className="text-3xl font-bold mb-1">
                  ${stats.revenue.toFixed(2)}
                </div>
                <div className="text-blue-100 text-sm">Total Revenue</div>
                <div className="text-blue-200 text-xs mt-1">
                  From completed payments
                </div>
              </div>
              <Link
                to="/admin/payments"
                className="bg-white border border-gray-200 rounded-xl p-6
                           hover:shadow-md transition-shadow flex items-center
                           gap-4"
              >
                <div className="w-12 h-12 bg-green-50 rounded-xl flex
                                items-center justify-center text-2xl">
                  💳
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    View All Payments
                  </div>
                  <div className="text-sm text-gray-400 mt-0.5">
                    Transaction history
                  </div>
                </div>
              </Link>
            </div>
          </>
        )}

        {/* ── Quick Actions ────────────────────────────── */}
        <h2 className="text-xs font-semibold text-gray-400 uppercase
                       tracking-wide mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: '⏳',
              title: 'Pending Instructors',
              desc: 'Review and approve instructor applications',
              to: '/admin/users',
              color: 'bg-amber-50 border-amber-200',
              textColor: 'text-amber-700',
            },
            {
              icon: '📋',
              title: 'Pending Courses',
              desc: 'Review and approve submitted courses',
              to: '/admin/courses/pending',
              color: 'bg-blue-50 border-blue-200',
              textColor: 'text-blue-700',
            },
            {
              icon: '👥',
              title: 'Manage Users',
              desc: 'View, search and manage all users',
              to: '/admin/users',
              color: 'bg-purple-50 border-purple-200',
              textColor: 'text-purple-700',
            },
            {
              icon: '💳',
              title: 'All Payments',
              desc: 'View all payment transactions',
              to: '/admin/payments',
              color: 'bg-green-50 border-green-200',
              textColor: 'text-green-700',
            },
            {
              icon: '🌐',
              title: 'Browse Courses',
              desc: 'View the public course catalog',
              to: '/courses',
              color: 'bg-gray-50 border-gray-200',
              textColor: 'text-gray-700',
            },
          ].map((action) => (
            <Link
              key={action.to + action.title}
              to={action.to}
              className={`rounded-xl border p-5 hover:shadow-md
                          transition-shadow ${action.color}`}
            >
              <div className="text-2xl mb-3">{action.icon}</div>
              <div className={`font-semibold mb-1 ${action.textColor}`}>
                {action.title}
              </div>
              <div className="text-xs text-gray-500">{action.desc}</div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
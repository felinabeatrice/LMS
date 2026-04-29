import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try { const res = await api.get('/admin/stats'); setStats(res.data.stats); }
      catch { setError('Failed to load dashboard stats.'); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8"><div className="flex items-center gap-3 mb-1"><span className="bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">ADMIN</span><h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1></div><p className="text-gray-500 text-sm">Welcome back, {user?.name}</p></div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">{error}</div>}
        {stats && (
          <>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Users</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Link to="/admin/users" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md"><div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 bg-blue-50">??</div><div className="text-2xl font-bold text-gray-900 mb-0.5">{stats.users.total}</div><div className="text-sm text-gray-500">Total Users</div></Link>
              <Link to="/admin/users" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md"><div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 bg-green-50">??</div><div className="text-2xl font-bold text-gray-900 mb-0.5">{stats.users.students}</div><div className="text-sm text-gray-500">Students</div></Link>
              <Link to="/admin/users" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md"><div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 bg-purple-50">??</div><div className="text-2xl font-bold text-gray-900 mb-0.5">{stats.users.instructors}</div><div className="text-sm text-gray-500">Instructors</div></Link>
              <Link to="/admin/users" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md"><div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 bg-amber-50">?</div><div className="text-2xl font-bold text-gray-900 mb-0.5">{stats.users.pending_instructors}</div><div className="text-sm text-gray-500">Pending Instructors</div></Link>
            </div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Courses</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-gray-200 p-5"><div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 bg-blue-50">??</div><div className="text-2xl font-bold text-gray-900 mb-0.5">{stats.courses.total}</div><div className="text-sm text-gray-500">Total Courses</div></div>
              <div className="bg-white rounded-xl border border-gray-200 p-5"><div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 bg-green-50">?</div><div className="text-2xl font-bold text-gray-900 mb-0.5">{stats.courses.approved}</div><div className="text-sm text-gray-500">Approved</div></div>
              <Link to="/admin/courses/pending" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md"><div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 bg-amber-50">??</div><div className="text-2xl font-bold text-gray-900 mb-0.5">{stats.courses.pending}</div><div className="text-sm text-gray-500">Pending Review</div></Link>
              <div className="bg-white rounded-xl border border-gray-200 p-5"><div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 bg-indigo-50">?????</div><div className="text-2xl font-bold text-gray-900 mb-0.5">{stats.enrollments}</div><div className="text-sm text-gray-500">Total Enrollments</div></div>
            </div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Revenue</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white"><div className="text-3xl font-bold mb-1"></div><div className="text-blue-100 text-sm">Total Revenue</div></div>
              <Link to="/admin/payments" className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-4"><div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl">??</div><div><div className="font-semibold text-gray-900">View All Payments</div><div className="text-sm text-gray-400 mt-0.5">Transaction history</div></div></Link>
            </div>
          </>
        )}
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/admin/users" className="rounded-xl border border-amber-200 bg-amber-50 p-5 hover:shadow-md"><div className="text-2xl mb-3">?</div><div className="font-semibold text-amber-700 mb-1">Pending Instructors</div><div className="text-xs text-gray-500">Review and approve instructor applications</div></Link>
          <Link to="/admin/courses/pending" className="rounded-xl border border-blue-200 bg-blue-50 p-5 hover:shadow-md"><div className="text-2xl mb-3">??</div><div className="font-semibold text-blue-700 mb-1">Pending Courses</div><div className="text-xs text-gray-500">Review and approve submitted courses</div></Link>
          <Link to="/admin/users" className="rounded-xl border border-purple-200 bg-purple-50 p-5 hover:shadow-md"><div className="text-2xl mb-3">??</div><div className="font-semibold text-purple-700 mb-1">Manage Users</div><div className="text-xs text-gray-500">View, search and manage all users</div></Link>
          <Link to="/admin/payments" className="rounded-xl border border-green-200 bg-green-50 p-5 hover:shadow-md"><div className="text-2xl mb-3">??</div><div className="font-semibold text-green-700 mb-1">All Payments</div><div className="text-xs text-gray-500">View all payment transactions</div></Link>
          <Link to="/courses" className="rounded-xl border border-gray-200 bg-gray-50 p-5 hover:shadow-md"><div className="text-2xl mb-3">??</div><div className="font-semibold text-gray-700 mb-1">Browse Courses</div><div className="text-xs text-gray-500">View the public course catalog</div></Link>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;

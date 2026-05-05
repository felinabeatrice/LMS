
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, BookOpen, Clock, CreditCard,
  GraduationCap, CheckCircle, ClipboardList,
  TrendingUp, Globe, UserCheck,
} from 'lucide-react';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import AnnouncementsList from '../../components/AnnouncementsList';

const StatCard = ({ icon: Icon, label, value, sub, color, to }) => {
  const content = (
    <div className="bg-white rounded-xl border border-gray-200 p-5
                    hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                       mb-3 ${color}`}>
        <Icon size={20} />
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-0.5">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
      {sub && (
        <div className="text-xs text-amber-600 mt-1 font-medium">{sub}</div>
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
const [announcements, setAnnouncements] = useState([]);

 useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, annRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/announcements/platform'),
      ]);
      setStats(statsRes.data.stats);
      setAnnouncements(annRes.data.announcements || []);
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent
                      rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700
                        rounded-xl px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      {stats && (
        <>
          {/* Users */}
          <h2 className="text-xs font-semibold text-gray-400 uppercase
                         tracking-wide mb-3">
            Users
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={Users}
              label="Total Users"
              value={stats.users.total}
              color="bg-blue-50 text-blue-600"
              to="/admin/users"
            />
            <StatCard
              icon={GraduationCap}
              label="Students"
              value={stats.users.students}
              color="bg-green-50 text-green-600"
              to="/admin/users"
            />
            <StatCard
              icon={UserCheck}
              label="Instructors"
              value={stats.users.instructors}
              color="bg-purple-50 text-purple-600"
              to="/admin/users"
            />
            <StatCard
              icon={Clock}
              label="Pending Instructors"
              value={stats.users.pending_instructors}
              color="bg-amber-50 text-amber-600"
              sub={
                stats.users.pending_instructors > 0
                  ? 'Needs approval'
                  : undefined
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
              icon={BookOpen}
              label="Total Courses"
              value={stats.courses.total}
              color="bg-blue-50 text-blue-600"
            />
            <StatCard
              icon={CheckCircle}
              label="Approved"
              value={stats.courses.approved}
              color="bg-green-50 text-green-600"
            />
            <StatCard
              icon={ClipboardList}
              label="Pending Review"
              value={stats.courses.pending}
              color="bg-amber-50 text-amber-600"
              sub={
                stats.courses.pending > 0
                  ? 'Action required'
                  : undefined
              }
              to="/admin/courses/pending"
            />
            <StatCard
              icon={TrendingUp}
              label="Total Enrollments"
              value={stats.enrollments}
              color="bg-indigo-50 text-indigo-600"
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
              <div className="flex items-center gap-2 mb-1">
                <CreditCard size={20} className="text-blue-200" />
                <span className="text-blue-200 text-sm">Total Revenue</span>
              </div>
              <div className="text-3xl font-bold">
                ${stats.revenue.toFixed(2)}
              </div>
              <div className="text-blue-200 text-xs mt-1">
                From completed payments
              </div>
            </div>
            <Link
              to="/admin/payments"
              className="bg-white border border-gray-200 rounded-xl p-6
                         hover:shadow-md transition-shadow flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center
                              justify-center flex-shrink-0">
                <CreditCard size={22} className="text-green-600" />
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

      {/* Quick Actions */}
      <h2 className="text-xs font-semibold text-gray-400 uppercase
                     tracking-wide mb-3">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            icon: Clock,
            title: 'Pending Instructors',
            desc: 'Review and approve instructor applications',
            to: '/admin/users',
            color: 'bg-amber-50 border-amber-200',
            iconColor: 'text-amber-600',
            textColor: 'text-amber-700',
          },
          {
            icon: ClipboardList,
            title: 'Pending Courses',
            desc: 'Review and approve submitted courses',
            to: '/admin/courses/pending',
            color: 'bg-blue-50 border-blue-200',
            iconColor: 'text-blue-600',
            textColor: 'text-blue-700',
          },
          {
            icon: Users,
            title: 'Manage Users',
            desc: 'View, search and manage all users',
            to: '/admin/users',
            color: 'bg-purple-50 border-purple-200',
            iconColor: 'text-purple-600',
            textColor: 'text-purple-700',
          },
          {
            icon: CreditCard,
            title: 'All Payments',
            desc: 'View all payment transactions',
            to: '/admin/payments',
            color: 'bg-green-50 border-green-200',
            iconColor: 'text-green-600',
            textColor: 'text-green-700',
          },
          {
            icon: Globe,
            title: 'Browse Courses',
            desc: 'View the public course catalog',
            to: '/courses',
            color: 'bg-gray-50 border-gray-200',
            iconColor: 'text-gray-600',
            textColor: 'text-gray-700',
          },
        ].map((action) => (
          <Link
            key={action.title}
            to={action.to}
            className={`rounded-xl border p-5 hover:shadow-md
                        transition-shadow ${action.color}`}
          >
            <div className={`mb-3 ${action.iconColor}`}>
              <action.icon size={24} />
            </div>
            <div className={`font-semibold mb-1 ${action.textColor}`}>
              {action.title}
            </div>
            <div className="text-xs text-gray-500">{action.desc}</div>
          </Link>
                ))}
      </div>

      {/* Announcements Section */}
      <div className="mt-8">
        <h2 className="text-xs font-semibold text-gray-400 uppercase
                       tracking-wide mb-3">
          Recent Announcements
        </h2>
        <AnnouncementsList
          announcements={announcements}
          title="Platform Announcements"
          emptyMessage="No announcements created yet. Create one from the Announcements page."
        />
      </div>

    </div>
  );
};

export default AdminDashboard;
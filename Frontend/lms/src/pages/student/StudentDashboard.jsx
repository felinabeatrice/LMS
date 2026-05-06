import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import AnnouncementsList from '../../components/AnnouncementsList';
import { formatPrice } from '../../utils/formatPrice';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
const [enrollments, setEnrollments] = useState([]);
const [loading, setLoading] = useState(true);
const [platformAnn, setPlatformAnn] = useState([]);
const [courseAnn, setCourseAnn] = useState([]);

  useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const [enrollRes, payRes, annRes] = await Promise.all([
        api.get('/enrollments/my-enrollments'),
        api.get('/payments/my-payments'),
        api.get('/announcements/student'),
      ]);
      const enrolls = enrollRes.data.enrollments || [];
      const payments = payRes.data.payments || [];
      const totalSpent = payments
  .filter((p) => p.status === 'completed')
  .reduce((sum, p) => sum + parseFloat(p.amount), 0);
setStats({
  totalEnrolled: enrolls.length,
  withAccess: enrolls.filter((e) => e.has_access).length,
  totalPayments: payments.length,
  totalSpent: totalSpent,   // ← keep as number
});
      setEnrollments(enrolls.slice(0, 3));
      setPlatformAnn(annRes.data.platform || []);
      setCourseAnn(annRes.data.course || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here is your learning overview</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link to="/student/enrollments" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 bg-blue-50">📚</div>
            <div className="text-2xl font-bold text-gray-900 mb-0.5">{stats?.totalEnrolled ?? 0}</div>
            <div className="text-sm text-gray-500">Courses Enrolled</div>
          </Link>
          <Link to="/student/enrollments" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 bg-green-50">✅</div>
            <div className="text-2xl font-bold text-gray-900 mb-0.5">{stats?.withAccess ?? 0}</div>
            <div className="text-sm text-gray-500">With Access</div>
          </Link>
          <Link to="/student/payments" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 bg-purple-50">💳</div>
            <div className="text-2xl font-bold text-gray-900 mb-0.5">{stats?.totalPayments ?? 0}</div>
            <div className="text-sm text-gray-500">Payments Made</div>
          </Link>
          <Link to="/student/payments" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 bg-amber-50">💰</div>
            <div className="text-2xl font-bold text-gray-900 mb-0.5">
  {formatPrice(stats?.totalSpent ?? 0)}
</div>
            <div className="text-sm text-gray-500">Total Spent</div>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link
            to="/courses"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-5 transition-colors flex items-center gap-3"
          >
            <span className="text-2xl">🔍</span>
            <div>
              <div className="font-semibold">Browse Courses</div>
              <div className="text-blue-100 text-xs mt-0.5">Find your next course</div>
            </div>
          </Link>
          <Link
            to="/student/enrollments"
            className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 rounded-xl p-5 transition-colors flex items-center gap-3"
          >
            <span className="text-2xl">📖</span>
            <div>
              <div className="font-semibold">My Enrollments</div>
              <div className="text-gray-400 text-xs mt-0.5">View all your courses</div>
            </div>
          </Link>
          <Link
            to="/student/payments"
            className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 rounded-xl p-5 transition-colors flex items-center gap-3"
          >
            <span className="text-2xl">💳</span>
            <div>
              <div className="font-semibold">My Payments</div>
              <div className="text-gray-400 text-xs mt-0.5">Payment history</div>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900">Recent Enrollments</h2>
            <Link to="/student/enrollments" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all
            </Link>
          </div>
          {enrollments.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-500 text-sm">You have not enrolled in any courses yet.</p>
              <Link
                to="/courses"
                className="inline-block mt-3 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Browse Courses
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.map((en) => (
                <div key={en.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                    📚
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{en.course?.title}</p>
                    <p className="text-xs text-gray-400">by {en.course?.instructor?.name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${en.has_access ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {en.has_access ? 'Access granted' : 'Pending payment'}
                    </span>
                    <Link
                      to={`/courses/${en.course_id}`}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
                        </div>
          )}
        </div>

        {/* Announcements Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnnouncementsList
            announcements={platformAnn}
            title="Platform News"
            emptyMessage="No platform announcements yet"
          />
          <AnnouncementsList
            announcements={courseAnn}
            title="From Your Courses"
            emptyMessage="No course announcements yet"
          />
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
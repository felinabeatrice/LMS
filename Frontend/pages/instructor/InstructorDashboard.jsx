import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';

const statusColor = (status) => {
  if (status === 'approved') return 'bg-green-100  text-green-700';
  if (status === 'pending')  return 'bg-amber-100  text-amber-700';
  return 'bg-red-100 text-red-700';
};

const InstructorDashboard = () => {
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get('/courses/my-courses');
        const courses = res.data.courses || [];
        setCourses(courses);

        const approved  = courses.filter((c) => c.status === 'approved').length;
        const pending   = courses.filter((c) => c.status === 'pending').length;
        const rejected  = courses.filter((c) => c.status === 'rejected').length;
        const students  = courses.reduce(
          (sum, c) => sum + (c._count?.enrollments || 0), 0
        );

        setStats({ total: courses.length, approved, pending, rejected, students });
      } catch (err) {
        console.error('Dashboard error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent
                        rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center
                        sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Instructor Dashboard
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Welcome back, {user?.name}
            </p>
          </div>
          <Link
            to="/instructor/courses/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5
                       rounded-xl text-sm font-semibold transition-colors
                       inline-flex items-center gap-2"
          >
            + Create New Course
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5
                        gap-4 mb-8">
          {[
            { label: 'Total Courses', value: stats?.total,    icon: '📚', color: 'bg-blue-50'   },
            { label: 'Approved',      value: stats?.approved, icon: '✅', color: 'bg-green-50'  },
            { label: 'Pending',       value: stats?.pending,  icon: '⏳', color: 'bg-amber-50'  },
            { label: 'Rejected',      value: stats?.rejected, icon: '❌', color: 'bg-red-50'    },
            { label: 'Total Students',value: stats?.students, icon: '👥', color: 'bg-purple-50' },
          ].map((s) => (
            <div key={s.label}
              className="bg-white rounded-xl border border-gray-200 p-4">
              <div className={`w-9 h-9 rounded-lg flex items-center
                               justify-center text-lg mb-2 ${s.color}`}>
                {s.icon}
              </div>
              <div className="text-xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link
            to="/instructor/courses/create"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl
                       p-5 flex items-center gap-3 transition-colors"
          >
            <span className="text-2xl">✏️</span>
            <div>
              <div className="font-semibold">Create Course</div>
              <div className="text-blue-100 text-xs mt-0.5">
                Build a new learning experience
              </div>
            </div>
          </Link>
          <Link
            to="/instructor/courses"
            className="bg-white hover:bg-gray-50 border border-gray-200
                       text-gray-800 rounded-xl p-5 flex items-center gap-3
                       transition-colors"
          >
            <span className="text-2xl">📋</span>
            <div>
              <div className="font-semibold">Manage Courses</div>
              <div className="text-gray-400 text-xs mt-0.5">
                Edit, update or delete courses
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Courses */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900">Your Courses</h2>
            <Link
              to="/instructor/courses"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all →
            </Link>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-500 text-sm">
                You haven't created any courses yet.
              </p>
              <Link
                to="/instructor/courses/create"
                className="inline-block mt-3 bg-blue-600 text-white px-5
                           py-2 rounded-lg text-sm font-medium
                           hover:bg-blue-700 transition-colors"
              >
                Create First Course
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.slice(0, 5).map((course) => (
                <div
                  key={course.id}
                  className="flex items-center gap-4 p-3 rounded-lg border
                             border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex
                                  items-center justify-center text-lg
                                  flex-shrink-0">
                    📚
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {course.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {course._count?.enrollments || 0} students •{' '}
                      {course.category?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full
                      font-medium capitalize ${statusColor(course.status)}`}>
                      {course.status}
                    </span>
                    <Link
                      to={`/instructor/courses/edit/${course.id}`}
                      className="text-xs text-blue-600 hover:text-blue-700
                                 font-medium"
                    >
                      Edit →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default InstructorDashboard;
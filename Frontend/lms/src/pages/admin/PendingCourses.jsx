import { useToast } from '../../components/Toast';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const PendingCourses = () => {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(null);
  const [messages, setMessages] = useState({});

  useEffect(() => { fetchPendingCourses(); }, []);

  const fetchPendingCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/courses/pending');
      setCourses(res.data.courses || []);
    } catch {
      setError('Failed to load pending courses.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (courseId, status) => {
    setActing(courseId);
    try {
      await api.patch(`/courses/${courseId}/status`, { status });
      setMessages((m) => ({
        ...m,
        [courseId]: status === 'approved' ? 'Course approved!' : 'Course rejected.',
      }));
      setTimeout(() => {
        setCourses((prev) => prev.filter((c) => c.id !== courseId));
      }, 1500);
    } catch (err) {
      setMessages((m) => ({
        ...m,
        [courseId]: err.response?.data?.message || 'Action failed.',
      }));
    } finally {
      setActing(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Pending Courses</h1>
          <p className="text-gray-500 text-sm mt-1">
            {courses.length} course{courses.length !== 1 ? 's' : ''} awaiting review
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        {courses.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="font-semibold text-gray-700 mb-2">All caught up!</h3>
            <p className="text-gray-400 text-sm">No courses are pending review right now.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="w-full sm:w-52 h-36 bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-4xl">📚</span>
                  </div>
                  <div className="flex-1 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                            Pending Review
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">{course.title}</h3>
                        <p className="text-xs text-gray-500">
                          by <span className="font-medium text-gray-700">{course.instructor?.name}</span>
                          {' '}({course.instructor?.email})
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleAction(course.id, 'approved')}
                          disabled={acting === course.id}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          {acting === course.id ? '...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleAction(course.id, 'rejected')}
                          disabled={acting === course.id}
                          className="bg-red-50 hover:bg-red-100 text-red-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium border border-red-200 transition-colors"
                        >
                          {acting === course.id ? '...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mb-3 text-xs text-gray-500">
                      <span>Category: {course.category?.name}</span>
                      <span>Duration: {Math.floor((course.duration || 0) / 60)}h {(course.duration || 0) % 60}m</span>
                      <span>Price: {course.is_free ? 'Free' : `$${parseFloat(course.price).toFixed(2)}`}</span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{course.description}</p>
                    <Link
                      to={`/courses/${course.id}`}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Preview course
                    </Link>
                    {messages[course.id] && (
                      <p className="text-xs mt-2 font-medium text-green-600">
                        {messages[course.id]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingCourses;
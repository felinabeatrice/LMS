import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const MyEnrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [paying,      setPaying]      = useState(null);
  const [payMsg,      setPayMsg]      = useState({});

  useEffect(() => { fetchEnrollments(); }, []);

  const fetchEnrollments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/enrollments/my-enrollments');
      setEnrollments(res.data.enrollments || []);
    } catch {
      setError('Failed to load enrollments.');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (courseId) => {
    setPaying(courseId);
    setPayMsg((m) => ({ ...m, [courseId]: '' }));
    try {
      const payRes  = await api.get('/payments/my-payments');
      const pending = payRes.data.payments.find(
        (p) => p.course_id === courseId && p.status === 'pending'
      );
      if (!pending) {
        setPayMsg((m) => ({ ...m, [courseId]: 'No pending payment found.' }));
        return;
      }
      await api.post(`/payments/${pending.id}/pay`);
      setPayMsg((m) => ({ ...m, [courseId]: '✅ Payment successful! Access granted.' }));
      fetchEnrollments();
    } catch (err) {
      setPayMsg((m) => ({ ...m, [courseId]: err.response?.data?.message || 'Payment failed.' }));
    } finally {
      setPaying(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Enrollments</h1>
            <p className="text-gray-500 text-sm mt-1">
              {enrollments.length} course{enrollments.length !== 1 ? 's' : ''} enrolled
            </p>
          </div>
          <Link to="/courses"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            + Browse More
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        {enrollments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="font-semibold text-gray-700 mb-2">No enrollments yet</h3>
            <p className="text-gray-400 text-sm mb-5">Start learning by enrolling in a course</p>
            <Link to="/courses"
              className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {enrollments.map((en) => {
              const course = en.course;
              const needsPayment = !course.is_free && !en.has_access;
              const thumbnailUrl = course.thumbnail_url
                ? `http://localhost:5000/uploads/thumbnails/${course.thumbnail_url}`
                : null;

              return (
                <div key={en.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow">
                  <div className="flex flex-col sm:flex-row">
                    <div className="w-full sm:w-48 h-32 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                      {thumbnailUrl ? (
                        <img src={thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">📚</span>
                      )}
                    </div>
                    <div className="flex-1 p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              en.has_access ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {en.has_access ? '✅ Access Granted' : '🔒 No Access'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {course.is_free ? 'Free' : `$${parseFloat(course.price).toFixed(2)}`}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">{course.title}</h3>
                          <p className="text-xs text-gray-500">by {course.instructor?.name} • {course.category?.name}</p>
                        </div>
                        <div className="flex flex-col gap-2 min-w-[140px]">
                          <Link to={`/courses/${en.course_id}`}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-center px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                            View Course
                          </Link>
                          {needsPayment && (
                            <button
                              onClick={() => handlePay(en.course_id)}
                              disabled={paying === en.course_id}
                              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              {paying === en.course_id ? 'Processing...' : `Pay $${parseFloat(course.price).toFixed(2)}`}
                            </button>
                          )}
                        </div>
                      </div>
                      {payMsg[en.course_id] && (
                        <p className={`text-xs mt-2 ${
                          payMsg[en.course_id].includes('✅') ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {payMsg[en.course_id]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEnrollments;
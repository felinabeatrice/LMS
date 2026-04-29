import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const statusColor = (status) => {
  if (status === 'approved') return 'bg-green-100 text-green-700';
  if (status === 'pending')  return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
};

const MyCourses = () => {
  const [courses,  setCourses]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/courses/my-courses');
      setCourses(res.data.courses || []);
    } catch {
      setError('Failed to load your courses.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    setDeleting(courseId);
    try {
      await api.delete(`/courses/${courseId}`);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    } finally {
      setDeleting(null);
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
            <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
            <p className="text-gray-500 text-sm mt-1">
              {courses.length} course{courses.length !== 1 ? 's' : ''} created
            </p>
          </div>
          <Link to="/instructor/courses/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            + Create Course
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        {courses.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="font-semibold text-gray-700 mb-2">No courses yet</h3>
            <Link to="/instructor/courses/create"
              className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
              Create Your First Course
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Course','Category','Students','Status','Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900 text-sm">{course.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {course.is_free ? 'Free' : `$${parseFloat(course.price).toFixed(2)}`}
                        {' • '}
                        {Math.floor((course.duration || 0) / 60)}h {(course.duration || 0) % 60}m
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{course.category?.name}</td>
                    <td className="px-5 py-4 text-sm font-medium text-gray-800">
                      {course._count?.enrollments || 0}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColor(course.status)}`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link to={`/instructor/courses/edit/${course.id}`}
                          className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(course.id)}
                          disabled={deleting === course.id}
                          className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          {deleting === course.id ? '...' : 'Delete'}
                        </button>
                      </div>
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

export default MyCourses;
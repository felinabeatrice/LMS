import { useState, useEffect } from 'react';
import { Link }                from 'react-router-dom';
import { MessageSquare, FileText } from 'lucide-react';
import api           from '../../api/axios';
import ConfirmModal  from '../../components/ConfirmModal';
import MessagesModal from '../../components/MessagesModal';
import RatingDisplay from '../../components/RatingDisplay';
import { useToast }  from '../../components/Toast';

const MyCourses = () => {
  const toast = useToast();
  const [courses,  setCourses]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [deleting, setDeleting] = useState(false);

  const [unreadCounts, setUnreadCounts] = useState({});

  const [modal, setModal] = useState({
    open: false, courseId: null, courseTitle: '',
  });

  const [msgModal, setMsgModal] = useState({
    open: false, course: null,
  });

  useEffect(() => {
    fetchCourses();
    fetchUnreadCounts();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/courses/my-courses');
      setCourses(res.data.courses || []);
    } catch {
      setError('Failed to load your courses.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCounts = async () => {
    try {
      const res = await api.get('/messages/unread-counts');
      const map = {};
      (res.data.counts || []).forEach((c) => { map[c.course_id] = c.unread; });
      setUnreadCounts(map);
    } catch { }
  };

  const openDeleteModal = (course) =>
    setModal({ open: true, courseId: course.id, courseTitle: course.title });

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/courses/${modal.courseId}`);
      setCourses((prev) => prev.filter((c) => c.id !== modal.courseId));
      setModal({ open: false, courseId: null, courseTitle: '' });
      toast.success('Course deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  const openMessages  = (course) => setMsgModal({ open: true, course });
  const closeMessages = () => {
    setMsgModal({ open: false, course: null });
    fetchUnreadCounts();
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent
                      rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">

      <ConfirmModal
        isOpen={modal.open}
        onClose={() =>
          setModal({ open: false, courseId: null, courseTitle: '' })}
        onConfirm={handleDelete}
        title="Delete Course"
        message={`Are you sure you want to delete "${modal.courseTitle}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        confirmColor="red"
        loading={deleting}
      />

      <MessagesModal
        isOpen={msgModal.open}
        onClose={closeMessages}
        course={msgModal.course}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-500 text-sm mt-1">
            {courses.length} course{courses.length !== 1 ? 's' : ''} created
          </p>
        </div>
        <Link
          to="/instructor/courses/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5
                     rounded-xl text-sm font-semibold transition-colors"
        >
          + Create Course
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700
                        rounded-xl px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      {courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200
                        p-12 text-center">
          <div className="text-5xl mb-4">📁</div>
          <h3 className="font-semibold text-gray-700 mb-2">
            No courses yet
          </h3>
          <Link
            to="/instructor/courses/create"
            className="inline-block bg-blue-600 text-white px-6 py-2.5
                       rounded-xl text-sm font-medium hover:bg-blue-700"
          >
            Create Your First Course
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200
                        overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold
                                 text-gray-500 uppercase">
                    Course
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold
                                 text-gray-500 uppercase hidden md:table-cell">
                    Category
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold
                                 text-gray-500 uppercase hidden sm:table-cell">
                    Students
                  </th>
                  {/* ── New rating column ── */}
                  <th className="text-left px-5 py-3 text-xs font-semibold
                                 text-gray-500 uppercase hidden lg:table-cell">
                    Rating
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold
                                 text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold
                                 text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {courses.map((course) => {
                  const unread     = unreadCounts[course.id] || 0;
                  const avgRating  = course.average_rating ?? 0;
                  const totalRatings =
                    course._count?.ratings ?? course.ratings?.length ?? 0;

                  return (
                    <tr
                      key={course.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Course title + price */}
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900 text-sm">
                          {course.title}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {course.is_free
                            ? 'Free'
                            : `$${parseFloat(course.price).toFixed(2)}`}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4 text-sm text-gray-600
                                     hidden md:table-cell">
                        {course.category?.name}
                      </td>

                      {/* Students */}
                      <td className="px-5 py-4 text-sm font-medium
                                     text-gray-800 hidden sm:table-cell">
                        {course._count?.enrollments || 0}
                      </td>

                      {/* ── Rating ── */}
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <RatingDisplay
                          average={avgRating}
                          total={totalRatings}
                          size="sm"
                        />
                      </td>

                      {/* Status badge */}
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full
                          font-medium capitalize
                          ${course.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : course.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                          {course.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/instructor/courses/edit/${course.id}`}
                            className="text-xs bg-blue-50 text-blue-700
                                       px-3 py-1.5 rounded-lg font-medium
                                       hover:bg-blue-100"
                          >
                            Edit
                          </Link>

                          <Link
                            to={`/instructor/courses/${course.id}/assignments`}
                            className="text-xs bg-orange-50 text-orange-700
                                       px-3 py-1.5 rounded-lg font-medium
                                       hover:bg-orange-100 flex items-center
                                       gap-1.5"
                          >
                            <FileText size={12} />
                            Assignments
                          </Link>

                          <button
                            onClick={() => openMessages(course)}
                            className="text-xs bg-purple-50 text-purple-700
                                       px-3 py-1.5 rounded-lg font-medium
                                       hover:bg-purple-100 flex items-center
                                       gap-1.5 relative"
                          >
                            <MessageSquare size={12} />
                            Messages
                            {unread > 0 && (
                              <span className="absolute -top-1.5 -right-1.5
                                               bg-red-500 text-white
                                               text-[10px] font-bold w-4 h-4
                                               rounded-full flex items-center
                                               justify-center">
                                {unread}
                              </span>
                            )}
                          </button>

                          <button
                            onClick={() => openDeleteModal(course)}
                            className="text-xs bg-red-50 text-red-700
                                       px-3 py-1.5 rounded-lg font-medium
                                       hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCourses;
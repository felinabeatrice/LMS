import { useState, useEffect, useRef } from 'react';
import { Link }                        from 'react-router-dom';
import {
  MessageSquare, FileText, Megaphone,
  MoreVertical, Edit, Trash2,
} from 'lucide-react';
import api                       from '../../api/axios';
import ConfirmModal              from '../../components/ConfirmModal';
import MessagesModal             from '../../components/MessagesModal';
import RatingDisplay             from '../../components/RatingDisplay';
import CourseAnnouncementsModal  from '../../components/CourseAnnouncementsModal';
import { useToast }              from '../../components/Toast';
import { formatPrice } from '../../utils/formatPrice';

// ─────────────────────────────────────────────────────────────────
// ActionsDropdown
// Per-row dropdown with all course actions
// ─────────────────────────────────────────────────────────────────
const ActionsDropdown = ({
  course, unread,
  onMessages, onAnnouncements, onDelete,
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef     = useRef(null);

  // ── Close on click outside ──────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // ── Helper: close dropdown then run action ──────────────────
  const handleAction = (fn) => {
    setOpen(false);
    fn();
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-lg hover:bg-gray-100
                   transition-colors flex items-center justify-center
                   text-gray-600"
        title="Actions"
      >
        <MoreVertical size={18} />

        {/* Red dot for unread messages */}
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2
                           bg-red-500 rounded-full ring-2 ring-white" />
        )}
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl
                        border border-gray-200 shadow-lg z-30
                        overflow-hidden animate-in fade-in
                        slide-in-from-top-1 duration-150">
          {/* Edit */}
          <Link
            to={`/instructor/courses/edit/${course.id}`}
            className="flex items-center gap-3 px-4 py-2.5 text-sm
                       text-gray-700 hover:bg-blue-50 hover:text-blue-700
                       transition-colors"
          >
            <Edit size={15} className="text-blue-600" />
            <span className="font-medium">Edit Course</span>
          </Link>

          {/* Assignments */}
          <Link
            to={`/instructor/courses/${course.id}/assignments`}
            className="flex items-center gap-3 px-4 py-2.5 text-sm
                       text-gray-700 hover:bg-orange-50 hover:text-orange-700
                       transition-colors"
          >
            <FileText size={15} className="text-orange-600" />
            <span className="font-medium">Assignments</span>
          </Link>

          {/* Messages */}
          <button
            onClick={() => handleAction(() => onMessages(course))}
            className="w-full flex items-center justify-between
                       px-4 py-2.5 text-sm text-gray-700
                       hover:bg-purple-50 hover:text-purple-700
                       transition-colors"
          >
            <span className="flex items-center gap-3">
              <MessageSquare size={15} className="text-purple-600" />
              <span className="font-medium">Messages</span>
            </span>
            {unread > 0 && (
              <span className="bg-red-500 text-white text-[10px]
                               font-bold w-5 h-5 rounded-full
                               flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>

          {/* Announcements */}
          <button
            onClick={() => handleAction(() => onAnnouncements(course))}
            className="w-full flex items-center gap-3 px-4 py-2.5
                       text-sm text-gray-700
                       hover:bg-yellow-50 hover:text-yellow-700
                       transition-colors"
          >
            <Megaphone size={15} className="text-yellow-600" />
            <span className="font-medium">Announcements</span>
          </button>

          {/* Divider */}
          <div className="border-t border-gray-100 my-1" />

          {/* Delete (red, destructive) */}
          <button
            onClick={() => handleAction(() => onDelete(course))}
            className="w-full flex items-center gap-3 px-4 py-2.5
                       text-sm text-red-600 hover:bg-red-50
                       transition-colors"
          >
            <Trash2 size={15} className="text-red-500" />
            <span className="font-medium">Delete Course</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// MyCourses
// ─────────────────────────────────────────────────────────────────
const MyCourses = () => {
  const toast = useToast();
  const [courses,  setCourses]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [deleting, setDeleting] = useState(false);

  const [unreadCounts, setUnreadCounts] = useState({});

  // Modals
  const [modal, setModal] = useState({
    open: false, courseId: null, courseTitle: '',
  });
  const [msgModal, setMsgModal] = useState({
    open: false, course: null,
  });
  const [annModal, setAnnModal] = useState({
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

  const openAnnouncements  = (course) => setAnnModal({ open: true, course });
  const closeAnnouncements = () => setAnnModal({ open: false, course: null });

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

      <CourseAnnouncementsModal
        isOpen={annModal.open}
        onClose={closeAnnouncements}
        course={annModal.course}
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
                        overflow-visible">
          <div className="overflow-x-auto overflow-y-visible">
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
                  <th className="text-left px-5 py-3 text-xs font-semibold
                                 text-gray-500 uppercase hidden lg:table-cell">
                    Rating
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold
                                 text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold
                                 text-gray-500 uppercase w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {courses.map((course) => {
                  const unread       = unreadCounts[course.id] || 0;
                  const avgRating    = course.average_rating ?? 0;
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
  {course.is_free ? 'Free' : formatPrice(course.price)}
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

                      {/* Rating */}
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

                      {/* ── Actions: 3-dot dropdown ── */}
                      <td className="px-5 py-4 text-right">
                        <ActionsDropdown
                          course={course}
                          unread={unread}
                          onMessages={openMessages}
                          onAnnouncements={openAnnouncements}
                          onDelete={openDeleteModal}
                        />
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
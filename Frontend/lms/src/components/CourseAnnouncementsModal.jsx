import { useState, useEffect } from 'react';
import { X, Megaphone, Send, Trash2, Calendar, AlertCircle } from 'lucide-react';
import api          from '../api/axios';
import ConfirmModal from './ConfirmModal';
import { useToast } from './Toast';

// ─────────────────────────────────────────────────────────────────
// CourseAnnouncementsModal
// Used by instructors to manage announcements for one course.
// Props:
//   isOpen   : bool
//   onClose  : fn
//   course   : { id, title }
// ─────────────────────────────────────────────────────────────────
const CourseAnnouncementsModal = ({ isOpen, onClose, course }) => {
  const toast = useToast();

  const [announcements, setAnnouncements] = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [creating,      setCreating]      = useState(false);

  // Form state
  const [title,   setTitle]   = useState('');
  const [content, setContent] = useState('');

  // Delete confirm
  const [deleteModal, setDeleteModal] = useState({
    open: false, id: null,
  });
  const [deleting, setDeleting] = useState(false);

  // ── Fetch on open ────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !course) return;
    fetchAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, course]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/announcements/course/${course.id}`);
      setAnnouncements(res.data.announcements || []);
    } catch {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  // ── Create ───────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setCreating(true);
    try {
      const res = await api.post('/announcements', {
        title:     title.trim(),
        content:   content.trim(),
        course_id: course.id,
      });
      setAnnouncements((prev) => [res.data.announcement, ...prev]);
      setTitle('');
      setContent('');
      toast.success('Announcement posted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post');
    } finally {
      setCreating(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/announcements/${deleteModal.id}`);
      setAnnouncements((prev) =>
        prev.filter((a) => a.id !== deleteModal.id)
      );
      setDeleteModal({ open: false, id: null });
      toast.success('Announcement deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  if (!isOpen || !course) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 flex items-center
                   justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl
                     max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ─────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-4
                          border-b border-gray-200 bg-gradient-to-r
                          from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex
                              items-center justify-center">
                <Megaphone size={20} className="text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">
                  Course Announcements
                </h2>
                <p className="text-xs text-gray-500 truncate max-w-[300px]">
                  {course.title}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* ── Create form ────────────────────────────────── */}
          <form
            onSubmit={handleCreate}
            className="border-b border-gray-100 p-5 bg-gray-50"
          >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title (e.g. Assignment 2 deadline extended)"
              maxLength={200}
              className="w-full px-4 py-2.5 border border-gray-300
                         rounded-lg text-sm mb-2 focus:outline-none
                         focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement here..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300
                         rounded-lg text-sm focus:outline-none
                         focus:ring-2 focus:ring-blue-500 bg-white
                         resize-none"
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-gray-400">
                Visible to all students enrolled in this course
              </p>
              <button
                type="submit"
                disabled={creating || !title.trim() || !content.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
                           text-white text-sm font-semibold px-5 py-2 rounded-lg
                           transition-colors flex items-center gap-1.5"
              >
                {creating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white
                                    border-t-transparent rounded-full
                                    animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Post
                  </>
                )}
              </button>
            </div>
          </form>

          {/* ── List ──────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-4 border-blue-600
                                border-t-transparent rounded-full
                                animate-spin" />
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-10">
                <Megaphone size={32}
                  className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-500">
                  No announcements yet
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Post your first announcement above
                </p>
              </div>
            ) : (
              announcements.map((a) => (
                <div
                  key={a.id}
                  className="border border-gray-200 rounded-xl p-4
                             hover:border-blue-200 hover:bg-blue-50/30
                             transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm
                                   flex-1">
                      {a.title}
                    </h3>
                    <button
                      onClick={() =>
                        setDeleteModal({ open: true, id: a.id })}
                      className="opacity-0 group-hover:opacity-100
                                 text-red-500 hover:text-red-700
                                 transition-opacity p-1"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1
                                whitespace-pre-line leading-relaxed">
                    {a.content}
                  </p>
                  <div className="flex items-center gap-1 mt-2
                                  text-xs text-gray-400">
                    <Calendar size={11} />
                    <span>{formatDate(a.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Announcement"
        message="Are you sure you want to delete this announcement? Students will no longer see it."
        confirmText="Yes, Delete"
        confirmColor="red"
        loading={deleting}
      />
    </>
  );
};

export default CourseAnnouncementsModal;
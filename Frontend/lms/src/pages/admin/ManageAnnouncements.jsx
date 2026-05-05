import { useState, useEffect } from 'react';
import { Megaphone, Trash2, Calendar, User } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';

const ManageAnnouncements = () => {
  const toast = useToast();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({ title: '', content: '' });

  // Delete modal
  const [modal, setModal] = useState({ open: false, id: null, title: '' });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/announcements/platform');
      setAnnouncements(res.data.announcements || []);
    } catch {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/announcements', {
        title: form.title.trim(),
        content: form.content.trim(),
      });
      toast.success('Announcement created!');
      setForm({ title: '', content: '' });
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (a) => {
    setModal({ open: true, id: a.id, title: a.title });
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/announcements/${modal.id}`);
      toast.success('Announcement deleted');
      setAnnouncements((prev) => prev.filter((x) => x.id !== modal.id));
      setModal({ open: false, id: null, title: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="max-w-5xl mx-auto">

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, id: null, title: '' })}
        onConfirm={handleDelete}
        title="Delete Announcement"
        message={`Are you sure you want to delete "${modal.title}"?`}
        confirmText="Yes, Delete"
        confirmColor="red"
        loading={deleting}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="bg-red-100 text-red-700 text-xs font-semibold
                           px-2.5 py-1 rounded-full">
            ADMIN
          </span>
          <h1 className="text-2xl font-bold text-gray-900">
            Manage Announcements
          </h1>
        </div>
        <p className="text-gray-500 text-sm">
          Create platform-wide announcements visible to all users
        </p>
      </div>

      {/* Create Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Megaphone size={20} className="text-blue-600" />
          <h2 className="font-bold text-gray-900">New Announcement</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Platform maintenance scheduled"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl
                         text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="Write your announcement here..."
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl
                         text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                         resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5
                       rounded-xl text-sm font-semibold transition-colors
                       disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent
                              rounded-full animate-spin" />
            )}
            {submitting ? 'Publishing...' : 'Publish Announcement'}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-900 mb-5">
          All Announcements ({announcements.length})
        </h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent
                            rounded-full animate-spin" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center
                            justify-center mx-auto mb-3">
              <Megaphone size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">No announcements yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="border border-gray-200 rounded-xl p-4
                           hover:border-blue-200 hover:bg-blue-50/30
                           transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {a.title}
                  </h3>
                  <button
                    onClick={() => openDeleteModal(a)}
                    className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg
                               transition-colors flex-shrink-0"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-3 whitespace-pre-line">
                  {a.content}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <User size={12} />
                    <span>{a.creator?.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{formatDate(a.created_at)}</span>
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

export default ManageAnnouncements;
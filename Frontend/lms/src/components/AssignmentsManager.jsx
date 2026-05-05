import { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, Calendar, Award, Users, Eye } from 'lucide-react';
import api from '../api/axios';
import { useToast } from './Toast';
import ConfirmModal from './ConfirmModal';
import SubmissionsModal from './SubmissionsModal';

const AssignmentsManager = ({ courseId }) => {
  const toast = useToast();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    due_date: '',
    max_marks: 100,
  });
  const [file, setFile] = useState(null);
  const [creating, setCreating] = useState(false);

  // Delete modal
  const [delModal, setDelModal] = useState({ open: false, id: null, title: '' });
  const [deleting, setDeleting] = useState(false);

  // Submissions modal
  const [subModal, setSubModal] = useState({ open: false, assignment: null });

  useEffect(() => {
    if (courseId) fetchAssignments();
  }, [courseId]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/courses/${courseId}/assignments`);
      setAssignments(res.data.assignments || []);
    } catch (err) {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  // 🆕 No more (e) parameter — no preventDefault needed
  const handleCreate = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.due_date) {
      toast.error('Title, description, and due date are required');
      return;
    }

    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      formData.append('due_date', new Date(form.due_date).toISOString());
      formData.append('max_marks', form.max_marks);
      if (file) formData.append('file', file);

      await api.post(`/courses/${courseId}/assignments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Assignment created!');
      setForm({ title: '', description: '', due_date: '', max_marks: 100 });
      setFile(null);
      setShowForm(false);
      fetchAssignments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  const openDelete = (a) => setDelModal({ open: true, id: a.id, title: a.title });

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/courses/${courseId}/assignments/${delModal.id}`);
      toast.success('Assignment deleted');
      setAssignments((prev) => prev.filter((a) => a.id !== delModal.id));
      setDelModal({ open: false, id: null, title: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const openSubmissions = (assignment) => {
    setSubModal({ open: true, assignment });
  };

  const closeSubmissions = () => {
    setSubModal({ open: false, assignment: null });
    fetchAssignments();
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const isPastDue = (dueDate) => new Date(dueDate) < new Date();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={delModal.open}
        onClose={() => setDelModal({ open: false, id: null, title: '' })}
        onConfirm={handleDelete}
        title="Delete Assignment"
        message={`Delete "${delModal.title}"? All student submissions will also be deleted.`}
        confirmText="Yes, Delete"
        confirmColor="red"
        loading={deleting}
      />

      {/* Submissions Modal */}
      <SubmissionsModal
        isOpen={subModal.open}
        onClose={closeSubmissions}
        assignment={subModal.assignment}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText size={18} className="text-blue-600" />
            Assignments
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} for this course
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
        >
          <Plus size={14} />
          {showForm ? 'Cancel' : 'New Assignment'}
        </button>
      </div>

      {/* 🆕 Create Form — Now using <div> instead of <form> */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Build a Todo App"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Instructions *</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe what students need to do..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Due Date *</label>
              <input
                type="datetime-local"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Max Marks</label>
              <input
                type="number"
                min={1}
                value={form.max_marks}
                onChange={(e) => setForm({ ...form, max_marks: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Instructions PDF (optional, max 10MB)
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            {file && <p className="text-xs text-gray-500 mt-1">Selected: {file.name}</p>}
          </div>

          {/* 🆕 Changed type="submit" to type="button" with onClick */}
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            {creating && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {creating ? 'Creating...' : 'Create Assignment'}
          </button>
        </div>
      )}

      {/* Assignments List */}
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
          <FileText size={32} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No assignments yet</p>
          <p className="text-xs text-gray-400 mt-1">Click "New Assignment" to create one</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div key={a.id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-200 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-gray-900">{a.title}</h3>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2 whitespace-pre-line">
                    {a.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openDelete(a)}
                  className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors flex-shrink-0"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex items-center gap-3 flex-wrap text-xs mt-3">
                <span className={`flex items-center gap-1 ${isPastDue(a.due_date) ? 'text-red-600' : 'text-gray-500'}`}>
                  <Calendar size={11} />
                  Due: {formatDate(a.due_date)}
                </span>
                <span className="flex items-center gap-1 text-gray-500">
                  <Award size={11} />
                  {a.max_marks} marks
                </span>
                <span className="flex items-center gap-1 text-blue-600 font-medium">
                  <Users size={11} />
                  {a._count?.submissions || 0} submission{(a._count?.submissions || 0) !== 1 ? 's' : ''}
                </span>
                {a.file_url && (
                  <a
                    href={`http://localhost:5000/uploads/assignments/${a.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-purple-600 hover:underline"
                  >
                    <FileText size={11} />
                    Instructions PDF
                  </a>
                )}
              </div>

              <button
                type="button"
                onClick={() => openSubmissions(a)}
                className="mt-3 text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg font-medium hover:bg-purple-100 flex items-center gap-1.5"
              >
                <Eye size={12} />
                View Submissions
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignmentsManager;
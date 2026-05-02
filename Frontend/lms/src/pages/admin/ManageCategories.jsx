import { useState, useEffect }       from 'react';
import {
  FolderOpen, Plus, Pencil, X,
  CheckCircle, Trash2,
} from 'lucide-react';
import api                           from '../../api/axios';
import ConfirmModal                  from '../../components/ConfirmModal';
import { useToast } from '../../components/Toast';

const ManageCategories = () => {
 const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  // Add
  const [newName,  setNewName]  = useState('');
  const [adding,   setAdding]   = useState(false);
  const [addModal, setAddModal] = useState(false);

  // Edit
  const [editingId,  setEditingId]  = useState(null);
  const [editName,   setEditName]   = useState('');
  const [saving,     setSaving]     = useState(false);
  const [editModal,  setEditModal]  = useState(false);

  // Delete
  const [deleteModal,   setDeleteModal]   = useState({
    open: false, categoryId: null, categoryName: '',
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Fetch ──────────────────────────────────────────────
  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/categories');
      setCategories(res.data.categories || []);
    } catch {
      setError('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  // ── Add ────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await api.post('/categories', { name: newName.trim() });
      setCategories((prev) => [...prev, res.data.category]);
      setNewName('');
      setAddModal(false);
      toast.success('Category added successfully!');
    } catch (err) {
      setAddModal(false);
      toast.error(err.response?.data?.message || 'Failed to add category.');
    } finally {
      setAdding(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────
  const startEdit = (category) => {
    setEditingId(category.id);
    setEditName(category.name);
  };

  const handleEdit = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const res = await api.patch(
        `/categories/${editingId}`,
        { name: editName.trim() }
      );
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? { ...c, name: res.data.category.name }
            : c
        )
      );
      setEditingId(null);
      setEditName('');
      setEditModal(false);
      toast.success('Category updated successfully!');
    } catch (err) {
      setEditModal(false);
      toast.error(
        err.response?.data?.message || 'Failed to update category.'
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  // ── Delete ─────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/categories/${deleteModal.categoryId}`);
      setCategories((prev) =>
        prev.filter((c) => c.id !== deleteModal.categoryId)
      );
      setDeleteModal({ open: false, categoryId: null, categoryName: '' });
      toast.success('Category deleted successfully!');
    } catch (err) {
      setDeleteModal({ open: false, categoryId: null, categoryName: '' });
      toast.error(
        err.response?.data?.message || 'Failed to delete category.'
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent
                      rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">

      {/* ── Confirm Add ───────────────────────────────── */}
      <ConfirmModal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        onConfirm={handleAdd}
        title="Add Category"
        message={`Are you sure you want to add the category "${newName}"?`}
        confirmText="Yes, Add"
        confirmColor="blue"
        loading={adding}
      />

      {/* ── Confirm Edit ──────────────────────────────── */}
      <ConfirmModal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        onConfirm={handleEdit}
        title="Update Category"
        message={`Are you sure you want to rename this category to "${editName}"?`}
        confirmText="Yes, Update"
        confirmColor="blue"
        loading={saving}
      />

      {/* ── Confirm Delete ────────────────────────────── */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() =>
          setDeleteModal({ open: false, categoryId: null, categoryName: '' })
        }
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteModal.categoryName}"? This cannot be undone.`}
        confirmText="Yes, Delete"
        confirmColor="red"
        loading={deleteLoading}
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Manage Categories
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {categories.length} categor
          {categories.length !== 1 ? 'ies' : 'y'} total
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700
                        rounded-xl px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      {/* ── Add New Category ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6
                      shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus size={18} className="text-blue-600" />
          Add New Category
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (!newName.trim()) {
                  toast.error('Please enter a category name.');
                  return;
                }
                setAddModal(true);
              }
            }}
            placeholder="e.g. BCA, MCA, B.Tech"
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl
                       text-sm focus:outline-none focus:ring-2
                       focus:ring-blue-500"
          />
          <button
            onClick={() => {
              if (!newName.trim()) {
                toast.error('Please enter a category name.');
                return;
              }
              setAddModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5
                       rounded-xl text-sm font-semibold transition-colors
                       flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Press Enter or click Add to create a new category
        </p>
      </div>

      {/* ── Categories List ───────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm
                      overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center
                        justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <FolderOpen size={18} className="text-blue-600" />
            All Categories
          </h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1
                           rounded-full font-medium">
            {categories.length} total
          </span>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center
                            justify-center mx-auto mb-4">
              <FolderOpen size={28} className="text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-700 mb-2">
              No categories yet
            </h3>
            <p className="text-gray-400 text-sm">
              Add your first category above
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-4 px-6 py-4
                           hover:bg-gray-50 transition-colors"
              >

                {/* Icon */}
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex
                                items-center justify-center flex-shrink-0">
                  <FolderOpen size={18} className="text-blue-600" />
                </div>

                {/* Name or edit input */}
                <div className="flex-1 min-w-0">
                  {editingId === cat.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && editName.trim()) {
                          setEditModal(true);
                        }
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      autoFocus
                      className="w-full px-3 py-1.5 border border-blue-300
                                 rounded-lg text-sm focus:outline-none
                                 focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {cat.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {cat._count?.courses || 0} course
                        {(cat._count?.courses || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {editingId === cat.id ? (
                    <>
                      <button
                        onClick={() => {
                          if (!editName.trim()) {
                            toast.error('Category name cannot be empty.');
                            return;
                          }
                          setEditModal(true);
                        }}
                        className="flex items-center gap-1.5 bg-green-50
                                   text-green-700 hover:bg-green-100 px-3
                                   py-1.5 rounded-lg text-xs font-medium
                                   transition-colors"
                      >
                        <CheckCircle size={13} />
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1.5 bg-gray-50
                                   text-gray-600 hover:bg-gray-100 px-3
                                   py-1.5 rounded-lg text-xs font-medium
                                   transition-colors"
                      >
                        <X size={13} />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(cat)}
                        className="flex items-center gap-1.5 bg-blue-50
                                   text-blue-700 hover:bg-blue-100 px-3
                                   py-1.5 rounded-lg text-xs font-medium
                                   transition-colors"
                      >
                        <Pencil size={13} />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteModal({
                          open:         true,
                          categoryId:   cat.id,
                          categoryName: cat.name,
                        })}
                        className="flex items-center gap-1.5 bg-red-50
                                   text-red-700 hover:bg-red-100 px-3
                                   py-1.5 rounded-lg text-xs font-medium
                                   transition-colors"
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info note */}
      <p className="text-xs text-gray-400 mt-4 text-center">
        Note: Categories with existing courses cannot be deleted.
        Remove all courses first before deleting a category.
      </p>

    </div>
  );
};

export default ManageCategories;
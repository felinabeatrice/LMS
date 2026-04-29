import { useState, useEffect } from 'react';
import api from '../../api/axios';

const roleColor = (role) => {
  if (role === 'admin')      return 'bg-red-100    text-red-700';
  if (role === 'instructor') return 'bg-purple-100 text-purple-700';
  return 'bg-green-100 text-green-700';
};

const ManageUsers = () => {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [search,   setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [pagination, setPagination] = useState({});
  const [page,     setPage]     = useState(1);

  // Action states
  const [approving, setApproving] = useState(null);
  const [deleting,  setDeleting]  = useState(null);
  const [actionMsg, setActionMsg] = useState('');

  const fetchUsers = async (p = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: p, limit: 15 };
      if (search)     params.search = search;
      if (roleFilter) params.role   = roleFilter;

      const res = await api.get('/admin/users', { params });
      setUsers(res.data.users || []);
      setPagination(res.data.pagination || {});
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page, roleFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(1);
  };

  const handleApprove = async (userId) => {
    setApproving(userId);
    setActionMsg('');
    try {
      await api.patch(`/admin/instructors/${userId}/approve`);
      setActionMsg('✅ Instructor approved successfully.');
      fetchUsers(page);
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Approval failed.');
    } finally {
      setApproving(null);
    }
  };

  const handleDelete = async (userId, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setDeleting(userId);
    setActionMsg('');
    try {
      await api.delete(`/admin/users/${userId}`);
      setActionMsg('✅ User deleted successfully.');
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Delete failed.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-500 text-sm mt-1">
            {pagination.total || 0} total users
          </p>
        </div>

        {/* Search + Filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <form onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg
                         text-sm focus:outline-none focus:ring-2
                         focus:ring-blue-500"
            />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500
                         bg-white"
            >
              <option value="">All roles</option>
              <option value="student">Students</option>
              <option value="instructor">Instructors</option>
              <option value="admin">Admins</option>
            </select>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5
                         py-2.5 rounded-lg text-sm font-medium
                         transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Action message */}
        {actionMsg && (
          <div className={`rounded-xl px-4 py-3 text-sm mb-5 border
            ${actionMsg.includes('✅')
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50   border-red-200   text-red-700'
            }`}>
            {actionMsg}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700
                          rounded-xl px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600
                            border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200
                            overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['ID', 'Name', 'Email', 'Role', 'Status',
                        'Courses', 'Joined', 'Actions'].map((h) => (
                        <th key={h}
                          className="text-left px-5 py-3 text-xs font-semibold
                                     text-gray-500 uppercase tracking-wide
                                     whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={8}
                          className="px-5 py-12 text-center text-gray-400 text-sm">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id}
                          className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4 text-xs text-gray-400">
                            #{u.id}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full
                                              bg-gradient-to-br
                                              from-blue-400 to-indigo-500
                                              flex items-center justify-center
                                              text-white text-xs font-bold
                                              flex-shrink-0">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900
                                               text-sm">
                                {u.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-500">
                            {u.email}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-xs px-2 py-0.5 rounded-full
                              font-medium capitalize ${roleColor(u.role)}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {u.role === 'instructor' ? (
                              <span className={`text-xs px-2 py-0.5 rounded-full
                                font-medium
                                ${u.is_approved
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-amber-100 text-amber-700'
                                }`}>
                                {u.is_approved ? '✅ Approved' : '⏳ Pending'}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600">
                            {u._count?.courses || 0} courses
                          </td>
                          <td className="px-5 py-4 text-xs text-gray-400
                                         whitespace-nowrap">
                            {new Date(u.created_at).toLocaleDateString(
                              'en-US',
                              { year: 'numeric', month: 'short', day: 'numeric' }
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              {/* Approve instructor button */}
                              {u.role === 'instructor' && !u.is_approved && (
                                <button
                                  onClick={() => handleApprove(u.id)}
                                  disabled={approving === u.id}
                                  className="text-xs bg-green-50 text-green-700
                                             px-3 py-1.5 rounded-lg font-medium
                                             hover:bg-green-100 disabled:opacity-50
                                             transition-colors whitespace-nowrap"
                                >
                                  {approving === u.id
                                    ? 'Approving...'
                                    : 'Approve'}
                                </button>
                              )}
                              {/* Delete button */}
                              {u.role !== 'admin' && (
                                <button
                                  onClick={() => handleDelete(u.id, u.name)}
                                  disabled={deleting === u.id}
                                  className="text-xs bg-red-50 text-red-700
                                             px-3 py-1.5 rounded-lg font-medium
                                             hover:bg-red-100 disabled:opacity-50
                                             transition-colors"
                                >
                                  {deleting === u.id ? '...' : 'Delete'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm border border-gray-200
                             rounded-lg disabled:opacity-40
                             hover:bg-gray-50 transition-colors"
                >
                  ← Prev
                </button>
                {Array.from(
                  { length: pagination.totalPages },
                  (_, i) => i + 1
                ).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 text-sm rounded-lg font-medium
                                transition-colors
                                ${p === page
                                  ? 'bg-blue-600 text-white'
                                  : 'border border-gray-200 hover:bg-gray-50'
                                }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === pagination.totalPages}
                  className="px-4 py-2 text-sm border border-gray-200
                             rounded-lg disabled:opacity-40
                             hover:bg-gray-50 transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;
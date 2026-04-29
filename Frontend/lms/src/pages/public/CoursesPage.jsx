import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

// ── Star display ───────────────────────────────────────────
const Stars = ({ rating }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-sm ${
            star <= Math.round(rating)
              ? 'text-yellow-400'
              : 'text-gray-200'
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
};

// ── Course card ────────────────────────────────────────────
const CourseCard = ({ course }) => {
  const thumbnailUrl = course.thumbnail_url
    ? `http://localhost:5000/uploads/thumbnails/${course.thumbnail_url}`
    : null;

  return (
    <Link
      to={`/courses/${course.id}`}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden
                 hover:shadow-md transition-shadow flex flex-col"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-200
                      flex items-center justify-center overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl">📚</span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">

        {/* Category + Free badge */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-blue-600 font-medium bg-blue-50
                           px-2 py-0.5 rounded-full">
            {course.category?.name || 'General'}
          </span>
          {course.is_free && (
            <span className="text-xs text-green-600 font-semibold bg-green-50
                             px-2 py-0.5 rounded-full">
              FREE
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-sm leading-snug
                       mb-1 line-clamp-2 flex-1">
          {course.title}
        </h3>

        {/* Instructor */}
        <p className="text-xs text-gray-500 mb-3">
          by {course.instructor?.name || 'Unknown'}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-xs font-bold text-gray-800">
            {course.average_rating?.toFixed(1) || '0.0'}
          </span>
          <Stars rating={course.average_rating || 0} />
          <span className="text-xs text-gray-400">
            ({course._count?.ratings || 0})
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3
                        border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {Math.floor((course.duration || 0) / 60)}h{' '}
            {(course.duration || 0) % 60}m
          </span>
          <span className="font-bold text-gray-900 text-sm">
            {course.is_free
              ? 'Free'
              : `$${parseFloat(course.price).toFixed(2)}`}
          </span>
        </div>

      </div>
    </Link>
  );
};

// ── Skeleton loader ────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden
                  animate-pulse">
    <div className="aspect-video bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="h-3 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
  </div>
);

const CoursesPage = () => {
  const [courses, setCourses]         = useState([]);
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [pagination, setPagination]   = useState({});

  const [filters, setFilters] = useState({
    search:   '',
    category: '',
    is_free:  '',
    page:     1,
    limit:    12,
  });

  // ── Fetch categories once ──────────────────────────────
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.categories || []);
      } catch {
        // non-critical
      }
    };
    fetchCategories();
  }, []);

  // ── Fetch courses when filters change ─────────────────
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {};
        if (filters.search)   params.search   = filters.search;
        if (filters.category) params.category = filters.category;
        if (filters.is_free !== '') params.is_free = filters.is_free;
        params.page  = filters.page;
        params.limit = filters.limit;

        const res = await api.get('/courses', { params });
        setCourses(res.data.courses || []);
        setPagination(res.data.pagination || {});
      } catch {
        setError('Failed to load courses. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((f) => ({ ...f, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HEADER ────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            All Courses
          </h1>
          <p className="text-gray-500 text-sm">
            {pagination.total
              ? `${pagination.total} courses available`
              : 'Browse our course catalog'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── SIDEBAR FILTERS ───────────────────────── */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-5
                            sticky top-20">
              <h2 className="font-semibold text-gray-900 mb-4">Filters</h2>

              {/* Search */}
              <form onSubmit={handleSearch} className="mb-5">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Search
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, search: e.target.value }))
                    }
                    placeholder="Search courses..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg
                               text-sm focus:outline-none focus:ring-2
                               focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg
                               text-sm hover:bg-blue-700 transition-colors"
                  >
                    Go
                  </button>
                </div>
              </form>

              {/* Category */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    handleFilterChange('category', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             text-sm focus:outline-none focus:ring-2
                             focus:ring-blue-500 bg-white"
                >
                  <option value="">All categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Price
                </label>
                <div className="space-y-2">
                  {[
                    { label: 'All courses', value: '' },
                    { label: 'Free only',   value: 'true' },
                    { label: 'Paid only',   value: 'false' },
                  ].map((opt) => (
                    <label key={opt.value}
                      className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="is_free"
                        value={opt.value}
                        checked={filters.is_free === opt.value}
                        onChange={() =>
                          handleFilterChange('is_free', opt.value)
                        }
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-600">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear filters */}
              <button
                onClick={() =>
                  setFilters({
                    search: '', category: '', is_free: '', page: 1, limit: 12,
                  })
                }
                className="w-full text-sm text-gray-500 hover:text-red-600
                           py-2 border border-gray-200 rounded-lg
                           hover:border-red-200 transition-colors"
              >
                Clear filters
              </button>
            </div>
          </aside>

          {/* ── COURSE GRID ───────────────────────────── */}
          <main className="flex-1">

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700
                              rounded-xl px-4 py-3 text-sm mb-6">
                {error}
              </div>
            )}

            {/* Loading skeletons */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2
                              xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {/* Courses */}
            {!loading && !error && (
              <>
                {courses.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-5xl mb-4">🔍</div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      No courses found
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Try adjusting your filters
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2
                                    xl:grid-cols-3 gap-5">
                      {courses.map((course) => (
                        <CourseCard key={course.id} course={course} />
                      ))}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-8">
                        <button
                          onClick={() => handlePageChange(filters.page - 1)}
                          disabled={filters.page === 1}
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
                            onClick={() => handlePageChange(p)}
                            className={`w-9 h-9 text-sm rounded-lg font-medium
                                        transition-colors
                                        ${p === filters.page
                                          ? 'bg-blue-600 text-white'
                                          : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                                        }`}
                          >
                            {p}
                          </button>
                        ))}

                        <button
                          onClick={() => handlePageChange(filters.page + 1)}
                          disabled={filters.page === pagination.totalPages}
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
              </>
            )}

          </main>
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;
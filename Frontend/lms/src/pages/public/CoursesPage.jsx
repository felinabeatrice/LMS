import { useState, useEffect } from 'react';
import { Link }                from 'react-router-dom';
import {
  Search, Clock, Users, BookOpen,
  SlidersHorizontal, X, ChevronRight,
} from 'lucide-react';
import api           from '../../api/axios';
import RatingDisplay from '../../components/RatingDisplay';

// ── Course card ────────────────────────────────────────────────
const CourseCard = ({ course }) => {
  const thumbnailUrl = course.thumbnail_url
    ? `http://localhost:5000/uploads/thumbnails/${course.thumbnail_url}`
    : null;

  const hours   = Math.floor((course.duration || 0) / 60);
  const minutes = (course.duration || 0) % 60;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm
                    hover:shadow-lg transition-all duration-300 overflow-hidden
                    flex flex-col group">

      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-blue-100
                      to-indigo-200 overflow-hidden relative flex-shrink-0">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105
                       transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={40} className="text-blue-300" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full
                            shadow-sm
            ${course.is_free
              ? 'bg-green-500 text-white'
              : 'bg-blue-600 text-white'}`}>
            {course.is_free
              ? 'FREE'
              : `$${parseFloat(course.price).toFixed(2)}`}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-2">
          <span className="text-xs font-medium text-blue-600 bg-blue-50
                           px-2.5 py-1 rounded-full">
            {course.category?.name || 'General'}
          </span>
        </div>

        <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1.5
                       line-clamp-2 group-hover:text-blue-600
                       transition-colors flex-1">
          {course.title}
        </h3>

        <p className="text-xs text-gray-500 mb-3">
          by{' '}
          <span className="font-medium text-gray-700">
            {course.instructor?.name || 'Unknown'}
          </span>
        </p>

        {/* ── Half-star rating display ── */}
        <div className="mb-3">
          <RatingDisplay
            average={course.average_rating || 0}
            total={course._count?.ratings || 0}
            size="sm"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {hours}h {minutes}m
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Users size={12} />
            {course._count?.enrollments || 0}
          </span>
        </div>

        <Link
          to={`/courses/${course.id}`}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white
                     text-center py-2.5 rounded-xl text-sm font-semibold
                     transition-colors flex items-center justify-center gap-2"
        >
          View Course
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
};

// ── Skeleton ───────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100
                  overflow-hidden animate-pulse">
    <div className="aspect-video bg-gray-200" />
    <div className="p-5 space-y-3">
      <div className="h-3 bg-gray-200 rounded w-1/4" />
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-10 bg-gray-200 rounded-xl" />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────
const CoursesPage = () => {
  const [courses,          setCourses]          = useState([]);
  const [categories,       setCategories]       = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState('');
  const [pagination,       setPagination]       = useState({});
  const [showFilters,      setShowFilters]      = useState(false);

  const [filters, setFilters] = useState({
    search:   '',
    is_free:  '',
    sort:     'newest',
    duration: '',
    page:     1,
    limit:    12,
  });

  // Fetch categories
  useEffect(() => {
    api.get('/categories')
      .then((r) => setCategories(r.data.categories || []))
      .catch(() => {});
  }, []);

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {
          page:  filters.page,
          limit: filters.limit,
        };
        if (filters.search)        params.search   = filters.search;
        if (selectedCategory)      params.category = selectedCategory;
        if (filters.is_free !== '') params.is_free  = filters.is_free;

        const res  = await api.get('/courses', { params });
        let   list = res.data.courses || [];

        // Client-side sort
        if (filters.sort === 'rating') {
          list = list.sort((a, b) =>
            (b.average_rating || 0) - (a.average_rating || 0)
          );
        } else if (filters.sort === 'price_low') {
          list = list.sort((a, b) =>
            parseFloat(a.price) - parseFloat(b.price)
          );
        } else if (filters.sort === 'price_high') {
          list = list.sort((a, b) =>
            parseFloat(b.price) - parseFloat(a.price)
          );
        }

        // Duration filter
        if (filters.duration) {
          list = list.filter((c) => {
            const h = (c.duration || 0) / 60;
            if (filters.duration === 'under2') return h < 2;
            if (filters.duration === '2to5')   return h >= 2 && h <= 5;
            if (filters.duration === 'over5')  return h > 5;
            return true;
          });
        }

        setCourses(list);
        setPagination(res.data.pagination || {});
      } catch {
        setError('Failed to load courses. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [filters, selectedCategory]);

  const updateFilter = (key, value) =>
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));

  const clearFilters = () => {
    setFilters({
      search: '', is_free: '', sort: 'newest',
      duration: '', page: 1, limit: 12,
    });
    setSelectedCategory(null);
  };

  const hasActiveFilters =
    filters.search || filters.is_free ||
    filters.duration || filters.sort !== 'newest' || selectedCategory;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700
                      text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Browse Courses
          </h1>
          <p className="text-blue-100 text-lg mb-6">
            {pagination.total
              ? `${pagination.total} courses available`
              : 'Explore our full course catalog'}
          </p>

          {/* Search */}
          <div className="flex gap-3 max-w-2xl">
            <div className="flex-1 relative">
              <Search size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2
                           text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                placeholder="Search courses..."
                className="w-full pl-11 pr-4 py-3 rounded-xl text-gray-900
                           placeholder-gray-400 focus:outline-none
                           focus:ring-2 focus:ring-blue-300 text-sm
                           bg-white shadow-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl
                          text-sm font-medium transition-colors border
                          ${showFilters
                            ? 'bg-white text-blue-700 border-white'
                            : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                          }`}
            >
              <SlidersHorizontal size={16} />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-amber-400 rounded-full" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-200
                          p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">Filter Courses</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-red-600 hover:text-red-700
                             font-medium flex items-center gap-1"
                >
                  <X size={14} /> Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600
                                  mb-1.5">
                  Price
                </label>
                <select
                  value={filters.is_free}
                  onChange={(e) => updateFilter('is_free', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300
                             rounded-lg text-sm focus:outline-none
                             focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Prices</option>
                  <option value="true">Free Only</option>
                  <option value="false">Paid Only</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600
                                  mb-1.5">
                  Duration
                </label>
                <select
                  value={filters.duration}
                  onChange={(e) => updateFilter('duration', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300
                             rounded-lg text-sm focus:outline-none
                             focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Any Duration</option>
                  <option value="under2">Under 2 Hours</option>
                  <option value="2to5">2 – 5 Hours</option>
                  <option value="over5">Over 5 Hours</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600
                                  mb-1.5">
                  Sort By
                </label>
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300
                             rounded-lg text-sm focus:outline-none
                             focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Layout */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Category sidebar */}
          <aside className="w-full lg:w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200
                            overflow-hidden shadow-sm sticky top-20">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm">
                  Categories
                </h3>
              </div>
              <nav className="py-2">
                {categories.length === 0 ? (
                  <p className="px-5 py-3 text-xs text-gray-400">
                    No categories found
                  </p>
                ) : (
                  categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(
                          selectedCategory === cat.id ? null : cat.id
                        );
                        updateFilter('page', 1);
                      }}
                      className={`w-full flex items-center justify-between
                                  px-5 py-3 text-sm font-medium
                                  transition-colors text-left
                                  ${selectedCategory === cat.id
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 hover:bg-gray-50'
                                  }`}
                    >
                      <span>{cat.name}</span>
                      {selectedCategory === cat.id && (
                        <ChevronRight size={14} />
                      )}
                    </button>
                  ))
                )}
              </nav>
            </div>
          </aside>

          {/* Course grid */}
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-gray-500">
                {loading
                  ? 'Loading courses...'
                  : `${courses.length} course${courses.length !== 1 ? 's' : ''} found`}
              </p>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs text-red-600 hover:text-red-700
                             font-medium flex items-center gap-1"
                >
                  <X size={12} /> Clear category
                </button>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700
                              rounded-xl px-4 py-3 text-sm mb-6">
                {error}
              </div>
            )}

            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2
                              xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {!loading && !error && courses.length === 0 && (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex
                                items-center justify-center mx-auto mb-4">
                  <Search size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No courses found
                </h3>
                <p className="text-gray-400 text-sm mb-5">
                  Try adjusting your filters or selecting a different category
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-xl
                             text-sm font-medium hover:bg-blue-700"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {!loading && !error && courses.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2
                                xl:grid-cols-3 gap-5">
                  {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center
                                  gap-2 mt-10">
                    <button
                      onClick={() =>
                        updateFilter('page', filters.page - 1)}
                      disabled={filters.page === 1}
                      className="px-4 py-2 text-sm border border-gray-200
                                 rounded-lg disabled:opacity-40
                                 hover:bg-gray-50"
                    >
                      ← Prev
                    </button>
                    {Array.from(
                      { length: Math.min(pagination.totalPages, 5) },
                      (_, i) => i + 1
                    ).map((p) => (
                      <button
                        key={p}
                        onClick={() => updateFilter('page', p)}
                        className={`w-9 h-9 text-sm rounded-lg font-medium
                          transition-colors
                          ${p === filters.page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-200 hover:bg-gray-50'
                          }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() =>
                        updateFilter('page', filters.page + 1)}
                      disabled={filters.page === pagination.totalPages}
                      className="px-4 py-2 text-sm border border-gray-200
                                 rounded-lg disabled:opacity-40
                                 hover:bg-gray-50"
                    >
                      Next →
                    </button>
                  </div>
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
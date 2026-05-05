import { useState, useEffect, useCallback } from 'react';
import { Trash2, Pencil, X, Check } from 'lucide-react';
import axios from '../api/axios';
import useAuth from '../hooks/useAuth';
import StarRating from './StarRating';
import RatingDisplay from './RatingDisplay';
import ConfirmModal from './ConfirmModal';

// ─────────────────────────────────────────────────────────────────
// RatingSection — Full Udemy-style ratings block
// Props:
//   courseId     : number
//   isFree       : bool
//   isEnrolled   : bool
//   hasAccess    : bool  (paid + access_granted OR free + enrolled)
// ─────────────────────────────────────────────────────────────────
export default function RatingSection({
  courseId,
  isFree,
  isEnrolled,
  hasAccess,
}) {
  const { user } = useAuth();

  // ── State ──────────────────────────────────────────────────────
  const [stats, setStats] = useState(null);          // { average_rating, total_ratings, distribution }
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // My rating state
  const [myRating, setMyRating] = useState(null);    // existing rating object or null
  const [isEditing, setIsEditing] = useState(false);
  const [editStars, setEditStars] = useState(0);
  const [editReview, setEditReview] = useState('');

  // Submit new rating state
  const [showForm, setShowForm] = useState(false);
  const [newStars, setNewStars] = useState(0);
  const [newReview, setNewReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch ratings ──────────────────────────────────────────────
  const fetchRatings = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      const res = await axios.get(
        `/ratings/course/${courseId}?page=${pageNum}&limit=10`
      );

      const { stats: s, ratings, pagination: p } = res.data;

      setStats(s);
      setPagination(p);

      if (append) {
        setReviews((prev) => [...prev, ...ratings]);
      } else {
        setReviews(ratings);
      }

      // ── Find my existing rating ──────────────────────────────
      if (user?.role === 'student') {
        const mine = ratings.find((r) => r.student?.id === user.id);
        if (mine && !myRating) {
          setMyRating(mine);
        }
      }
    } catch (err) {
      console.error('Fetch ratings error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [courseId, user, myRating]);

  useEffect(() => {
    fetchRatings(1, false);
  }, [courseId]);

  // ── Also fetch my ratings separately to ensure we get it ──────
  useEffect(() => {
    if (user?.role !== 'student') return;

    const fetchMyRating = async () => {
      try {
        const res = await axios.get('/ratings/my-ratings');
        const mine = res.data.ratings.find(
          (r) => r.course?.id === courseId
        );
        if (mine) {
          setMyRating(mine);
          setEditStars(parseFloat(mine.stars));
          setEditReview(mine.review || '');
        }
      } catch (err) {
        console.error('Fetch my rating error:', err);
      }
    };

    fetchMyRating();
  }, [courseId, user]);

  // ── Submit new rating ─────────────────────────────────────────
  const handleSubmit = async () => {
    setFormError('');

    if (newStars === 0) {
      setFormError('Please select a star rating');
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post('/ratings', {
        course_id: courseId,
        stars: newStars,
        review: newReview.trim() || null,
      });

      setMyRating(res.data.rating);
      setEditStars(parseFloat(res.data.rating.stars));
      setEditReview(res.data.rating.review || '');
      setShowForm(false);
      setNewStars(0);
      setNewReview('');
      // Refresh
      await fetchRatings(1, false);
      setPage(1);
    } catch (err) {
      setFormError(
        err.response?.data?.message || 'Failed to submit rating'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit existing rating ──────────────────────────────────────
  const handleEdit = async () => {
    if (editStars === 0) return;

    try {
      setSubmitting(true);
      const res = await axios.patch(`/ratings/${myRating.id}`, {
        stars: editStars,
        review: editReview.trim() || null,
      });

      setMyRating(res.data.rating);
      setIsEditing(false);
      await fetchRatings(1, false);
      setPage(1);
    } catch (err) {
      console.error('Edit rating error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete rating ─────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      setDeleting(true);
      await axios.delete(`/ratings/${myRating.id}`);
      setMyRating(null);
      setShowDeleteModal(false);
      setIsEditing(false);
      await fetchRatings(1, false);
      setPage(1);
    } catch (err) {
      console.error('Delete rating error:', err);
    } finally {
      setDeleting(false);
    }
  };

  // ── Load more ─────────────────────────────────────────────────
  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchRatings(nextPage, true);
  };

  // ── Distribution bar ──────────────────────────────────────────
  const DistributionBar = ({ starLevel, count, total }) => {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-blue-600 w-8 text-right shrink-0">
          {starLevel} ★
        </span>
        <div className="flex-1 bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-yellow-400 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 w-8 shrink-0">{pct}%</span>
      </div>
    );
  };

  // ── Single review card ────────────────────────────────────────
  const ReviewCard = ({ rating }) => {
    const isOwn = user?.id === rating.student?.id;
    const date = new Date(rating.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <div
        className={`border rounded-xl p-4 ${
          isOwn ? 'border-yellow-300 bg-yellow-50' : 'border-gray-100 bg-white'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          {/* Avatar + name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <span className="text-indigo-700 font-bold text-sm">
                {rating.student?.name?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {rating.student?.name}
                {isOwn && (
                  <span className="ml-2 text-xs text-yellow-600 font-normal">
                    (You)
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-400">{date}</p>
            </div>
          </div>

          {/* Stars */}
          <StarRating
            value={parseFloat(rating.stars)}
            size="sm"
            readonly
          />
        </div>

        {/* Review text */}
        {rating.review && (
          <p className="mt-3 text-sm text-gray-700 leading-relaxed">
            {rating.review}
          </p>
        )}
      </div>
    );
  };

  // ── Can rate? ─────────────────────────────────────────────────
  const canRate =
    user?.role === 'student' &&
    isEnrolled &&
    hasAccess;

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="mt-10 space-y-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>
    );
  }

  const avg = stats?.average_rating?.average ?? 0;
  const totalRatings = stats?.total_ratings ?? 0;
  const dist = stats?.distribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  return (
    <section className="mt-12">
      {/* ── Section header ─────────────────────────────────────── */}
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Student Ratings & Reviews
      </h2>

      {/* ── Stats block ────────────────────────────────────────── */}
      {totalRatings > 0 ? (
        <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8">
          {/* Big average */}
          <div className="flex flex-col items-center shrink-0">
            <span className="text-6xl font-extrabold text-yellow-500 leading-none">
              {Number(avg).toFixed(1)}
            </span>
            <StarRating value={avg} size="md" readonly />
            <span className="text-sm text-gray-500 mt-1">
              Course Rating
            </span>
          </div>

          {/* Distribution bars */}
          <div className="flex-1 w-full space-y-2">
            {[5, 4, 3, 2, 1].map((level) => (
              <DistributionBar
                key={level}
                starLevel={level}
                count={dist[level] ?? 0}
                total={totalRatings}
              />
            ))}
          </div>

          {/* Total count */}
          <div className="shrink-0 text-center">
            <p className="text-2xl font-bold text-gray-800">
              {totalRatings.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">
              {totalRatings === 1 ? 'rating' : 'ratings'}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8 text-center">
          <p className="text-gray-500">
            No ratings yet. Be the first to rate this course!
          </p>
        </div>
      )}

      {/* ── My rating block (student only) ─────────────────────── */}
      {canRate && (
        <div className="mb-8">
          {/* ── Has existing rating ──────────────────────────── */}
          {myRating && !isEditing && (
            <div className="border border-indigo-200 bg-indigo-50 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">Your Rating</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setEditStars(parseFloat(myRating.stars));
                      setEditReview(myRating.review || '');
                    }}
                    className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 transition"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
              <StarRating
                value={parseFloat(myRating.stars)}
                size="md"
                readonly
              />
              {myRating.review && (
                <p className="mt-2 text-sm text-gray-700">
                  {myRating.review}
                </p>
              )}
            </div>
          )}

          {/* ── Edit form ────────────────────────────────────── */}
          {myRating && isEditing && (
            <div className="border border-indigo-300 bg-indigo-50 rounded-2xl p-5">
              <h3 className="font-semibold text-gray-800 mb-3">
                Edit Your Rating
              </h3>
              <StarRating
                value={editStars}
                onChange={setEditStars}
                size="lg"
              />
              <textarea
                value={editReview}
                onChange={(e) => setEditReview(e.target.value)}
                placeholder="Update your review (optional)"
                rows={3}
                className="mt-3 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleEdit}
                  disabled={submitting || editStars === 0}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── No rating yet — show button or form ──────────── */}
          {!myRating && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-sm rounded-xl transition"
            >
              ★ Rate This Course
            </button>
          )}

          {!myRating && showForm && (
            <div className="border border-yellow-300 bg-yellow-50 rounded-2xl p-5">
              <h3 className="font-semibold text-gray-800 mb-3">
                Rate This Course
              </h3>
              <StarRating
                value={newStars}
                onChange={setNewStars}
                size="lg"
              />
              <textarea
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                placeholder="Share your experience (optional)"
                rows={3}
                className="mt-3 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
              />
              {formError && (
                <p className="mt-2 text-sm text-red-500">{formError}</p>
              )}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || newStars === 0}
                  className="flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-sm rounded-xl transition disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {submitting ? 'Submitting...' : 'Submit Rating'}
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setNewStars(0);
                    setNewReview('');
                    setFormError('');
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Reviews list ───────────────────────────────────────── */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Reviews ({totalRatings.toLocaleString()})
          </h3>
          {reviews.map((r) => (
            <ReviewCard key={r.id} rating={r} />
          ))}

          {/* Load more */}
          {pagination && page < pagination.totalPages && (
            <div className="text-center pt-2">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2 border border-gray-300 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More Reviews'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Delete confirm modal ────────────────────────────────── */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Rating"
        message="Are you sure you want to delete your rating? This cannot be undone."
        confirmText="Delete"
        confirmClass="bg-red-600 hover:bg-red-700 text-white"
      />
    </section>
  );
}
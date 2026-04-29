import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';

// ── Stars display ──────────────────────────────────────────
const Stars = ({ rating, interactive = false, onRate }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        onClick={() => interactive && onRate && onRate(star)}
        className={`text-xl ${interactive ? 'cursor-pointer' : ''}
          ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
      >
        ★
      </span>
    ))}
  </div>
);

const CourseDetailPage = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user, isStudent } = useAuth();

  const [course,     setCourse]     = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  // Enroll/Pay state
  const [enrolling,  setEnrolling]  = useState(false);
  const [paying,     setPaying]     = useState(false);
  const [actionMsg,  setActionMsg]  = useState('');
  const [actionErr,  setActionErr]  = useState('');

  // Rating state
  const [myRating,   setMyRating]   = useState(null);
  const [ratingForm, setRatingForm] = useState({ stars: 0, review: '' });
  const [ratingMsg,  setRatingMsg]  = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch course ───────────────────────────────────────
  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/courses/${id}`);
        setCourse(res.data.course);
      } catch {
        setError('Course not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  // ── Check enrollment if logged in student ─────────────
  useEffect(() => {
    if (!user || !isStudent) return;
    const checkEnrollment = async () => {
      try {
        const res = await api.get(`/enrollments/check/${id}`);
        setEnrollment(res.data);
      } catch {
        // not enrolled
      }
    };
    checkEnrollment();
  }, [id, user, isStudent]);

  // ── Check existing rating ──────────────────────────────
  useEffect(() => {
    if (!user || !isStudent) return;
    const fetchMyRating = async () => {
      try {
        const res = await api.get('/ratings/my-ratings');
        const found = res.data.ratings.find(
          (r) => r.course_id === parseInt(id)
        );
        if (found) {
          setMyRating(found);
          setRatingForm({ stars: found.stars, review: found.review || '' });
        }
      } catch {
        // no ratings yet
      }
    };
    fetchMyRating();
  }, [id, user, isStudent]);

  // ── Enroll ─────────────────────────────────────────────
  const handleEnroll = async () => {
    if (!user) { navigate('/login'); return; }
    setEnrolling(true);
    setActionMsg('');
    setActionErr('');
    try {
      const res = await api.post('/enrollments', { course_id: id });
      setActionMsg(res.data.message);
      // Refresh enrollment state
      const check = await api.get(`/enrollments/check/${id}`);
      setEnrollment(check.data);
    } catch (err) {
      setActionErr(err.response?.data?.message || 'Enrollment failed.');
    } finally {
      setEnrolling(false);
    }
  };

  // ── Pay ────────────────────────────────────────────────
  const handlePay = async () => {
    setPaying(true);
    setActionMsg('');
    setActionErr('');
    try {
      // Get pending payment
      const paymentsRes = await api.get('/payments/my-payments');
      const pending = paymentsRes.data.payments.find(
        (p) => p.course_id === parseInt(id) && p.status === 'pending'
      );
      if (!pending) {
        setActionErr('No pending payment found.');
        return;
      }
      const res = await api.post(`/payments/${pending.id}/pay`);
      setActionMsg(res.data.message);
      // Refresh enrollment
      const check = await api.get(`/enrollments/check/${id}`);
      setEnrollment(check.data);
    } catch (err) {
      setActionErr(err.response?.data?.message || 'Payment failed.');
    } finally {
      setPaying(false);
    }
  };

  // ── Submit rating ──────────────────────────────────────
  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (ratingForm.stars === 0) {
      setRatingMsg('Please select a star rating.');
      return;
    }
    setSubmitting(true);
    setRatingMsg('');
    try {
      if (myRating) {
        // Edit existing
        await api.patch(`/ratings/${myRating.id}`, ratingForm);
        setRatingMsg('Rating updated!');
      } else {
        // New rating
        await api.post('/ratings', {
          course_id: id,
          stars: ratingForm.stars,
          review: ratingForm.review,
        });
        setRatingMsg('Rating submitted!');
      }
      // Refresh course for updated average
      const res = await api.get(`/courses/${id}`);
      setCourse(res.data.course);
    } catch (err) {
      setRatingMsg(err.response?.data?.message || 'Failed to submit rating.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent
                        rounded-full animate-spin" />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────
  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">{error}</h2>
          <Link to="/courses"
            className="text-blue-600 hover:underline text-sm">
            ← Back to courses
          </Link>
        </div>
      </div>
    );
  }

  const thumbnailUrl = course.thumbnail_url
    ? `http://localhost:5000/uploads/thumbnails/${course.thumbnail_url}`
    : null;

  const hasAccess   = enrollment?.has_access;
  const isEnrolled  = enrollment?.enrolled;
  const needsPayment = isEnrolled && !hasAccess && !course.is_free;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── MAIN CONTENT ────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Back */}
            <Link to="/courses"
              className="inline-flex items-center gap-1 text-sm text-gray-500
                         hover:text-blue-600 mb-6 transition-colors">
              ← Back to courses
            </Link>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              {course.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="bg-blue-50 text-blue-700 text-xs font-medium
                               px-2.5 py-1 rounded-full">
                {course.category?.name}
              </span>
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <span className="font-bold text-gray-800">
                  {course.average_rating?.toFixed(1) || '0.0'}
                </span>
                <Stars rating={course.average_rating || 0} />
                <span className="text-gray-400">
                  ({course.ratings?.length || 0} reviews)
                </span>
              </span>
              <span className="text-sm text-gray-500">
                👥 {course._count?.enrollments || 0} students
              </span>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              Created by{' '}
              <span className="font-medium text-gray-700">
                {course.instructor?.name}
              </span>
            </p>

            {/* Thumbnail */}
            <div className="aspect-video bg-gradient-to-br from-blue-100
                            to-blue-200 rounded-xl overflow-hidden mb-6
                            flex items-center justify-center">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-6xl">📚</span>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h2 className="font-bold text-gray-900 mb-3">
                About this course
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {course.description}
              </p>
            </div>

            {/* Video — only if has access */}
            {hasAccess && course.video_url && (
              <div className="bg-white rounded-xl border border-gray-200
                              p-6 mb-6">
                <h2 className="font-bold text-gray-900 mb-4">
                  🎥 Course Video
                </h2>
                <video
                  controls
                  className="w-full rounded-lg"
                  src={`http://localhost:5000/api/courses/${course.id}/video`}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {/* Rating form — only enrolled students */}
            {isStudent && isEnrolled && hasAccess && (
              <div className="bg-white rounded-xl border border-gray-200
                              p-6 mb-6">
                <h2 className="font-bold text-gray-900 mb-4">
                  {myRating ? '✏️ Edit your rating' : '⭐ Rate this course'}
                </h2>
                <form onSubmit={handleRatingSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your rating
                    </label>
                    <Stars
                      rating={ratingForm.stars}
                      interactive
                      onRate={(star) =>
                        setRatingForm((f) => ({ ...f, stars: star }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Review (optional)
                    </label>
                    <textarea
                      value={ratingForm.review}
                      onChange={(e) =>
                        setRatingForm((f) => ({ ...f, review: e.target.value }))
                      }
                      rows={3}
                      placeholder="Share your experience..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg
                                 text-sm focus:outline-none focus:ring-2
                                 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  {ratingMsg && (
                    <p className={`text-sm ${
                      ratingMsg.includes('!')
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {ratingMsg}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                               text-white px-6 py-2 rounded-lg text-sm font-medium
                               transition-colors"
                  >
                    {submitting
                      ? 'Submitting...'
                      : myRating
                        ? 'Update rating'
                        : 'Submit rating'}
                  </button>
                </form>
              </div>
            )}

            {/* Reviews list */}
            {course.ratings && course.ratings.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-bold text-gray-900 mb-4">
                  Student reviews
                </h2>
                <div className="space-y-4">
                  {course.ratings.map((rating) => (
                    <div key={rating.id}
                      className="border-b border-gray-100 last:border-0 pb-4
                                 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-800">
                          {rating.student?.name}
                        </span>
                        <Stars rating={rating.stars} />
                      </div>
                      {rating.review && (
                        <p className="text-sm text-gray-600">{rating.review}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ── SIDEBAR ─────────────────────────────── */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-6
                            sticky top-20">

              {/* Price */}
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {course.is_free
                  ? 'Free'
                  : `$${parseFloat(course.price).toFixed(2)}`}
              </div>
              {course.is_free && (
                <p className="text-green-600 text-sm font-medium mb-4">
                  No payment required
                </p>
              )}

              {/* Course info */}
              <div className="space-y-2 py-4 border-y border-gray-100 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-medium text-gray-800">
                    {Math.floor((course.duration || 0) / 60)}h{' '}
                    {(course.duration || 0) % 60}m
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Category</span>
                  <span className="font-medium text-gray-800">
                    {course.category?.name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Students</span>
                  <span className="font-medium text-gray-800">
                    {course._count?.enrollments || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Rating</span>
                  <span className="font-medium text-gray-800">
                    {course.average_rating?.toFixed(1) || 'N/A'} ★
                  </span>
                </div>
              </div>

              {/* Action messages */}
              {actionMsg && (
                <div className="bg-green-50 border border-green-200
                                text-green-700 rounded-lg px-3 py-2 text-sm mb-3">
                  {actionMsg}
                </div>
              )}
              {actionErr && (
                <div className="bg-red-50 border border-red-200 text-red-700
                                rounded-lg px-3 py-2 text-sm mb-3">
                  {actionErr}
                </div>
              )}

              {/* CTA Buttons */}
              {!user && (
                <Link to="/login"
                  className="block w-full bg-blue-600 hover:bg-blue-700
                             text-white text-center font-semibold py-3
                             rounded-xl text-sm transition-colors">
                  Login to Enroll
                </Link>
              )}

              {user && isStudent && !isEnrolled && (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full bg-blue-600 hover:bg-blue-700
                             disabled:bg-blue-400 text-white font-semibold
                             py-3 rounded-xl text-sm transition-colors"
                >
                  {enrolling ? 'Enrolling...' : 'Enroll Now'}
                </button>
              )}

              {user && isStudent && needsPayment && (
                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="w-full bg-green-600 hover:bg-green-700
                             disabled:bg-green-400 text-white font-semibold
                             py-3 rounded-xl text-sm transition-colors"
                >
                  {paying
                    ? 'Processing...'
                    : `Pay $${parseFloat(course.price).toFixed(2)}`}
                </button>
              )}

              {user && isStudent && hasAccess && (
                <div className="bg-green-50 border border-green-200
                                rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">✅</div>
                  <p className="text-green-700 font-semibold text-sm">
                    You have full access
                  </p>
                  {course.video_url && (
                    <p className="text-green-600 text-xs mt-1">
                      Scroll down to watch the video
                    </p>
                  )}
                </div>
              )}

              {user && !isStudent && (
                <div className="bg-gray-50 border border-gray-200
                                rounded-xl p-4 text-center">
                  <p className="text-gray-500 text-sm">
                    {user.role === 'instructor'
                      ? 'You are viewing as instructor'
                      : 'You are viewing as admin'}
                  </p>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
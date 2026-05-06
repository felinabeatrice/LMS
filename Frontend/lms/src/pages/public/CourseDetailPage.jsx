import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock, Users, BookOpen, Lock, Play,
  CheckCircle, AlertCircle, MessageSquare, Send, User
} from 'lucide-react';
import AssignmentsViewer  from '../../components/AssignmentsViewer';
import AnnouncementsList  from '../../components/AnnouncementsList';
import RatingSection      from '../../components/RatingSection';
import RatingDisplay      from '../../components/RatingDisplay';
import api                from '../../api/axios';
import useAuth            from '../../hooks/useAuth';
import { useToast }       from '../../components/Toast';
import { formatPrice }    from '../../utils/formatPrice';

const CourseDetailPage = () => {
  const { id }              = useParams();
  const navigate            = useNavigate();
  const { user, isStudent } = useAuth();
  const toast               = useToast();
  const videoRef            = useRef(null);
  const messagesEndRef      = useRef(null);

  const [course,     setCourse]     = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const [enrolling,  setEnrolling]  = useState(false);
  const [paying,     setPaying]     = useState(false);
  const [actionMsg,  setActionMsg]  = useState('');
  const [actionErr,  setActionErr]  = useState('');

  const [messages,    setMessages]    = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [newMessage,  setNewMessage]  = useState('');
  const [sendingMsg,  setSendingMsg]  = useState(false);

  const [courseAnnouncements, setCourseAnnouncements] = useState([]);

  const isAdmin      = user?.role === 'admin';
  const isInstructor = user?.role === 'instructor';

  const hasAccess =
    isAdmin || isInstructor || enrollment?.has_access;

  const isEnrolled   = enrollment?.enrolled;
  const needsPayment =
    isStudent && isEnrolled && !enrollment?.has_access && !course?.is_free;

  const canRate =
    isStudent &&
    isEnrolled &&
    (course?.is_free ? true : hasAccess);

  // Fetch course
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

  // Check enrollment
  useEffect(() => {
    if (!user || !isStudent) return;
    const checkEnrollment = async () => {
      try {
        const res = await api.get(`/enrollments/check/${id}`);
        setEnrollment(res.data);
      } catch { }
    };
    checkEnrollment();
  }, [id, user, isStudent]);

  // Fetch Messages
  useEffect(() => {
    if (!user || !isStudent || !hasAccess) return;
    const fetchMessages = async () => {
      setLoadingMsgs(true);
      try {
        const res = await api.get(`/messages/course/${id}`);
        setMessages(res.data.messages || []);
      } catch { }
      finally {
        setLoadingMsgs(false);
      }
    };
    fetchMessages();
  }, [id, user, isStudent, hasAccess]);

  // Fetch announcements
  useEffect(() => {
    if (!user || !isStudent || !hasAccess) return;
    const fetchAnn = async () => {
      try {
        const res = await api.get(`/announcements/course/${id}`);
        setCourseAnnouncements(res.data.announcements || []);
      } catch { }
    };
    fetchAnn();
  }, [id, user, isStudent, hasAccess]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleEnroll = async () => {
    if (!user) { navigate('/login'); return; }
    setEnrolling(true);
    setActionMsg('');
    setActionErr('');
    try {
      const res = await api.post('/enrollments', { course_id: id });
      setActionMsg(res.data.message);
      const check = await api.get(`/enrollments/check/${id}`);
      setEnrollment(check.data);
    } catch (err) {
      setActionErr(err.response?.data?.message || 'Enrollment failed.');
    } finally {
      setEnrolling(false);
    }
  };

  const handlePay = async () => {
    setPaying(true);
    setActionMsg('');
    setActionErr('');
    try {
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
      const check = await api.get(`/enrollments/check/${id}`);
      setEnrollment(check.data);
    } catch (err) {
      setActionErr(err.response?.data?.message || 'Payment failed.');
    } finally {
      setPaying(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSendingMsg(true);
    try {
      const instructorId = course.instructor?.id || course.instructor_id;
      const res = await api.post('/messages', {
        receiver_id: instructorId,
        course_id:   course.id,
        content:     newMessage.trim(),
      });
      setMessages((prev) => [...prev, res.data.data]);
      setNewMessage('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSendingMsg(false);
    }
  };

  const formatTime = (d) =>
    new Date(d).toLocaleString('en-IN', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent
                      rounded-full animate-spin" />
    </div>
  );

  if (error || !course) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center
                        justify-center mx-auto mb-4">
          <AlertCircle size={32} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">{error}</h2>
        <Link to="/courses"
          className="text-blue-600 hover:underline text-sm">
          ← Back to courses
        </Link>
      </div>
    </div>
  );

  const thumbnailUrl = course.thumbnail_url
    ? `http://localhost:5000/uploads/thumbnails/${course.thumbnail_url}`
    : null;

  const hours   = Math.floor((course.duration || 0) / 60);
  const minutes = (course.duration || 0) % 60;

  const avgRating   = course.average_rating  ?? 0;
  const totalRating = course._count?.ratings ?? course.ratings?.length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link to="/courses" className="hover:text-white transition-colors">
              Courses
            </Link>
            <span>/</span>
            <span className="text-white font-medium truncate">
              {course.title}
            </span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <span className="inline-block bg-blue-600/30 text-blue-300
                               text-xs font-medium px-3 py-1 rounded-full mb-4
                               border border-blue-500/30">
                {course.category?.name}
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold
                             mb-4 leading-tight">
                {course.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                <RatingDisplay
                  average={avgRating}
                  total={totalRating}
                  size="sm"
                />
                <span className="flex items-center gap-1.5 text-gray-400">
                  <Users size={14} />
                  {course._count?.enrollments || 0} students
                </span>
                <span className="flex items-center gap-1.5 text-gray-400">
                  <Clock size={14} />
                  {hours}h {minutes}m
                </span>
              </div>

              <p className="text-gray-400 text-sm">
                Created by{' '}
                <span className="text-white font-medium">
                  {course.instructor?.name}
                </span>
              </p>
            </div>

            <div className="hidden lg:block">
              <PriceCard
                course={course} user={user} isStudent={isStudent}
                isEnrolled={isEnrolled} hasAccess={hasAccess}
                needsPayment={needsPayment} enrolling={enrolling}
                paying={paying} actionMsg={actionMsg} actionErr={actionErr}
                onEnroll={handleEnroll} onPay={handlePay} navigate={navigate}
                avgRating={avgRating} totalRating={totalRating}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 space-y-6">

            {/* Video */}
            <div className="bg-white rounded-2xl border border-gray-200
                            overflow-hidden shadow-sm">
              {hasAccess && course.video_url ? (
                <div>
                  <div className="bg-black">
                    <video
                      ref={videoRef}
                      controls
                      className="w-full max-h-[450px]"
                      src={`http://localhost:5000/api/courses/${course.id}/video?token=${localStorage.getItem('token')}`}
                    >
                      Your browser does not support video.
                    </video>
                  </div>
                  <div className="p-4 flex items-center gap-2 bg-green-50
                                  border-t border-green-100">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-sm text-green-700 font-medium">
                      You have full access to this course
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="aspect-video bg-gradient-to-br
                                  from-blue-100 to-indigo-200
                                  relative overflow-hidden">
                    {thumbnailUrl ? (
                      <img src={thumbnailUrl} alt={course.title}
                        className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center
                                      justify-center">
                        <BookOpen size={48} className="text-blue-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 flex
                                    items-center justify-center">
                      <div className="text-center text-white">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm
                                        rounded-full flex items-center
                                        justify-center mx-auto mb-3
                                        border border-white/30">
                          {isEnrolled && needsPayment
                            ? <Lock size={28} className="text-white" />
                            : <Play size={28} className="text-white fill-white" />
                          }
                        </div>
                        <p className="font-semibold text-sm">
                          {isEnrolled && needsPayment
                            ? 'Complete payment to watch'
                            : !isEnrolled
                              ? 'Enroll to watch this course'
                              : 'No video uploaded yet'}
                        </p>
                        {!course.video_url && hasAccess && (
                          <p className="text-xs text-white/70 mt-1">
                            Instructor has not uploaded a video yet
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Messages */}
            {isStudent && hasAccess && (
              <div className="bg-white rounded-2xl border border-gray-200
                              p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5 border-b
                                border-gray-100 pb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex
                                  items-center justify-center">
                    <MessageSquare size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 text-lg">
                      Message Instructor
                    </h2>
                    <p className="text-xs text-gray-500">
                      Ask questions directly to {course.instructor?.name}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl border border-gray-200
                                flex flex-col h-[400px]">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loadingMsgs ? (
                      <div className="flex justify-center py-10">
                        <div className="w-6 h-6 border-4 border-blue-600
                                        border-t-transparent rounded-full
                                        animate-spin" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-10">
                        <MessageSquare size={32}
                          className="text-gray-300 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-500">
                          No messages yet
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Start a conversation with your instructor!
                        </p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMine = msg.sender_id === user?.id;
                        return (
                          <div key={msg.id}
                            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] ${isMine ? 'items-end' : 'items-start'}`}>
                              {!isMine && (
                                <div className="flex items-center gap-1.5 mb-1 ml-1">
                                  <User size={10} className="text-gray-400" />
                                  <p className="text-[11px] font-medium text-gray-500">
                                    {msg.sender?.name}
                                  </p>
                                </div>
                              )}
                              <div className={`px-4 py-2.5 text-sm ${isMine
                                ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm'
                                : 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-bl-sm'
                              }`}>
                                {msg.content}
                              </div>
                              <p className={`text-[10px] text-gray-400 mt-1
                                ${isMine ? 'text-right mr-1' : 'ml-1'}`}>
                                {formatTime(msg.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSendMessage}
                    className="border-t border-gray-200 p-3 bg-white
                               rounded-b-xl flex items-center gap-2">
                    <input type="text" value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Ask a question..."
                      disabled={sendingMsg}
                      className="flex-1 px-4 py-2.5 border border-gray-300
                                 rounded-xl text-sm focus:outline-none
                                 focus:ring-2 focus:ring-blue-500
                                 disabled:opacity-50" />
                    <button type="submit"
                      disabled={sendingMsg || !newMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white
                                 p-2.5 rounded-xl transition-colors
                                 disabled:opacity-50 flex items-center
                                 justify-center w-11 h-11">
                      {sendingMsg ? (
                        <div className="w-4 h-4 border-2 border-white
                                        border-t-transparent rounded-full
                                        animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Course Announcements */}
            {isStudent && hasAccess && (
              <AnnouncementsList
                announcements={courseAnnouncements}
                title="Course Announcements"
                emptyMessage="No announcements from your instructor yet"
              />
            )}

            {/* Assignments */}
            {isStudent && hasAccess && (
              <AssignmentsViewer courseId={course.id} />
            )}

            {/* About */}
            <div className="bg-white rounded-2xl border border-gray-200
                            p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 text-xl mb-4">
                About This Course
              </h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">
                {course.description}
              </p>
            </div>

            {/* Rating */}
            <div className="bg-white rounded-2xl border border-gray-200
                            p-6 shadow-sm">
              <RatingSection
                courseId={parseInt(id)}
                isFree={course.is_free}
                isEnrolled={!!isEnrolled}
                hasAccess={canRate}
              />
            </div>
          </div>

          {/* Mobile price card */}
          <div className="lg:hidden">
            <PriceCard
              course={course} user={user} isStudent={isStudent}
              isEnrolled={isEnrolled} hasAccess={hasAccess}
              needsPayment={needsPayment} enrolling={enrolling}
              paying={paying} actionMsg={actionMsg} actionErr={actionErr}
              onEnroll={handleEnroll} onPay={handlePay} navigate={navigate}
              avgRating={avgRating} totalRating={totalRating}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// PriceCard
const PriceCard = ({
  course, user, isStudent, isEnrolled, hasAccess, needsPayment,
  enrolling, paying, actionMsg, actionErr, onEnroll, onPay, navigate,
  avgRating, totalRating,
}) => {
  const hours   = Math.floor((course.duration || 0) / 60);
  const minutes = (course.duration || 0) % 60;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6
                    shadow-lg sticky top-20">
      <div className="text-3xl font-extrabold text-gray-900 mb-1">
        {course.is_free ? 'Free' : formatPrice(course.price)}
      </div>
      {course.is_free && (
        <p className="text-green-600 text-sm font-medium mb-4">
          No payment required
        </p>
      )}

      <div className="space-y-2 py-4 border-y border-gray-100 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 flex items-center gap-1.5">
            <Clock size={14} /> Duration
          </span>
          <span className="font-medium text-gray-900">
            {hours}h {minutes}m
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 flex items-center gap-1.5">
            <BookOpen size={14} /> Category
          </span>
          <span className="font-medium text-gray-900">
            {course.category?.name}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 flex items-center gap-1.5">
            <Users size={14} /> Students
          </span>
          <span className="font-medium text-gray-900">
            {course._count?.enrollments || 0}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Rating</span>
          <RatingDisplay
            average={avgRating}
            total={totalRating}
            size="sm"
            showCount={false}
          />
        </div>
      </div>

      {actionMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700
                        rounded-xl px-3 py-2 text-sm mb-3 flex items-center gap-2">
          <CheckCircle size={14} />
          {actionMsg}
        </div>
      )}
      {actionErr && (
        <div className="bg-red-50 border border-red-200 text-red-700
                        rounded-xl px-3 py-2 text-sm mb-3 flex items-center gap-2">
          <AlertCircle size={14} />
          {actionErr}
        </div>
      )}

      {!user && (
        <button onClick={() => navigate('/login')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white
                     font-bold py-3 rounded-xl transition-colors flex
                     items-center justify-center gap-2">
          <Lock size={16} /> Login to Enroll
        </button>
      )}

      {user && isStudent && !isEnrolled && (
        <button onClick={onEnroll} disabled={enrolling}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                     text-white font-bold py-3 rounded-xl transition-colors
                     flex items-center justify-center gap-2">
          {enrolling ? (
            <>
              <div className="w-4 h-4 border-2 border-white
                              border-t-transparent rounded-full animate-spin" />
              Enrolling...
            </>
          ) : (
            <>
              <BookOpen size={16} />
              {course.is_free ? 'Enroll Now — Free' : 'Enroll Now'}
            </>
          )}
        </button>
      )}

      {user && isStudent && needsPayment && (
        <button onClick={onPay} disabled={paying}
          className="w-full bg-green-600 hover:bg-green-700
                     disabled:bg-green-400 text-white font-bold py-3
                     rounded-xl transition-colors flex items-center
                     justify-center gap-2">
          {paying ? (
            <>
              <div className="w-4 h-4 border-2 border-white
                              border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle size={16} />
              Pay {formatPrice(course.price)} — Unlock
            </>
          )}
        </button>
      )}

      {user && isStudent && hasAccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl
                        p-4 text-center">
          <CheckCircle size={24} className="text-green-600 mx-auto mb-2" />
          <p className="text-green-700 font-semibold text-sm">
            You have full access
          </p>
        </div>
      )}

      {user && !isStudent && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl
                        p-4 text-center">
          <p className="text-gray-500 text-sm capitalize">
            Viewing as {user.role}
          </p>
        </div>
      )}

      <div className="mt-5 pt-5 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-700 mb-3
                      uppercase tracking-wide">
          This course includes
        </p>
        <ul className="space-y-2 text-xs text-gray-600">
          {[
            { icon: Play,     text: 'HD video lessons' },
            { icon: Clock,    text: 'Lifetime access' },
            { icon: BookOpen, text: 'Expert instructor' },
          ].map((item) => (
            <li key={item.text} className="flex items-center gap-2">
              <item.icon size={13} className="text-blue-500 flex-shrink-0" />
              {item.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CourseDetailPage;
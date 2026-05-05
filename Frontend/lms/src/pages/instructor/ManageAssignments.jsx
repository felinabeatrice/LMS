import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import AssignmentsManager from '../../components/AssignmentsManager';

const ManageAssignments = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !course) return (
    <div className="max-w-3xl mx-auto py-20">
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">{error}</h2>
        <Link to="/instructor/courses" className="text-blue-600 hover:underline text-sm">
          ← Back to My Courses
        </Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">

      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate('/instructor/courses')}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to My Courses
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen size={22} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
              Assignments for
            </p>
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              {course.title}
            </h1>
            <p className="text-xs text-gray-500">
              {course.category?.name} • {course._count?.enrollments || 0} students
            </p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize flex-shrink-0
            ${course.status === 'approved' ? 'bg-green-100 text-green-700' :
              course.status === 'pending' ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'}`}>
            {course.status}
          </span>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
        <span className="text-xl flex-shrink-0">💡</span>
        <p className="text-sm text-blue-800">
          Creating, deleting, or grading assignments here will <strong>not</strong> require
          admin re-approval. Only changes to course details (title, description, video) require approval.
        </p>
      </div>

      {/* Assignments Manager Component */}
      <AssignmentsManager courseId={id} />

    </div>
  );
};

export default ManageAssignments;
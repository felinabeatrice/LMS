import { useState, useEffect } from 'react';
import { X, FileText, User, Calendar, Award, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import api from '../api/axios';
import { useToast } from './Toast';

const SubmissionsModal = ({ isOpen, onClose, assignment }) => {
  const toast = useToast();

  const [gradingId, setGradingId] = useState(null);
  const [gradeForm, setGradeForm] = useState({ marks: '', feedback: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setSubmissions(assignment?.submissions || []);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, assignment]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const openGradeForm = (sub) => {
    setGradingId(sub.id);
    setGradeForm({
      marks: sub.marks ?? '',
      feedback: sub.feedback || '',
    });
  };

  const closeGradeForm = () => {
    setGradingId(null);
    setGradeForm({ marks: '', feedback: '' });
  };

  const handleGrade = async (e) => {
    e.preventDefault();
    if (gradeForm.marks === '' || gradeForm.marks === null) {
      toast.error('Please enter marks');
      return;
    }

    const marks = parseInt(gradeForm.marks);
    if (marks < 0 || marks > assignment.max_marks) {
      toast.error(`Marks must be between 0 and ${assignment.max_marks}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.patch(`/assignments/${gradingId}/grade`, {
        marks,
        feedback: gradeForm.feedback,
      });

      // Update local state
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === gradingId
            ? { ...s, marks: res.data.submission.marks, feedback: res.data.submission.feedback, graded_at: res.data.submission.graded_at }
            : s
        )
      );

      toast.success('Submission graded successfully');
      closeGradeForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to grade');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const isLate = (submittedAt) => new Date(submittedAt) > new Date(assignment.due_date);

  if (!isOpen || !assignment) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-900 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Submissions</h2>
              <p className="text-blue-200 text-xs truncate max-w-md">
                {assignment.title} — Max marks: {assignment.max_marks}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Submissions List */}
        <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
          {submissions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FileText size={24} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">No submissions yet</p>
              <p className="text-xs text-gray-400">
                Students will appear here when they submit
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-white border border-gray-200 rounded-xl p-4"
                >
                  {/* Student Info */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                        {sub.student?.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">
                          {sub.student?.name}
                        </p>
                        <p className="text-xs text-gray-500">{sub.student?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLate(sub.submitted_at) && (
                        <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                          Late
                        </span>
                      )}
                      {sub.marks !== null ? (
                        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle size={11} />
                          Graded
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock size={11} />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Submission Details */}
                  <div className="space-y-2 mb-3 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={12} />
                      <span>Submitted: {formatDate(sub.submitted_at)}</span>
                    </div>
                    {sub.comment && (
                      <div className="flex items-start gap-2">
                        <MessageSquare size={12} className="mt-0.5 flex-shrink-0" />
                        <p className="text-gray-600 italic">"{sub.comment}"</p>
                      </div>
                    )}
                  </div>

                  {/* File link */}
                  <div className="mb-3">
                    <a
                      href={`http://localhost:5000/uploads/submissions/${sub.file_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg font-medium transition-colors"
                    >
                      <FileText size={14} />
                      View Submission File
                    </a>
                  </div>

                  {/* Already Graded Display */}
                  {sub.marks !== null && gradingId !== sub.id && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Award size={14} className="text-green-600" />
                          <span className="text-sm font-semibold text-green-800">
                            {sub.marks} / {assignment.max_marks}
                          </span>
                        </div>
                        <span className="text-xs text-green-600">
                          Graded on {sub.graded_at && formatDate(sub.graded_at)}
                        </span>
                      </div>
                      {sub.feedback && (
                        <p className="text-xs text-gray-600 mt-1 italic">
                          Feedback: {sub.feedback}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Grade Form */}
                  {gradingId === sub.id ? (
                    <form onSubmit={handleGrade} className="border-t border-gray-200 pt-3 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Marks (out of {assignment.max_marks}) *
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={assignment.max_marks}
                          value={gradeForm.marks}
                          onChange={(e) => setGradeForm({ ...gradeForm, marks: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Feedback (optional)
                        </label>
                        <textarea
                          rows={2}
                          value={gradeForm.feedback}
                          onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                          placeholder="Add feedback for the student..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {submitting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                          Save Grade
                        </button>
                        <button
                          type="button"
                          onClick={closeGradeForm}
                          className="text-xs text-gray-600 hover:text-gray-800 px-3 py-1.5"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => openGradeForm(sub)}
                      className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg font-medium hover:bg-purple-100 flex items-center gap-1.5"
                    >
                      <Award size={12} />
                      {sub.marks !== null ? 'Edit Grade' : 'Grade Now'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionsModal;
import { useState, useEffect } from 'react';
import {
  FileText, Calendar, Award, Upload, CheckCircle,
  Clock, AlertCircle, Eye, MessageSquare, RefreshCw,
} from 'lucide-react';
import api from '../api/axios';
import { useToast } from './Toast';

const AssignmentsViewer = ({ courseId }) => {
  const toast = useToast();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Submit state
  const [activeId, setActiveId] = useState(null);  // which assignment is being submitted
  const [submitFile, setSubmitFile] = useState(null);
  const [submitComment, setSubmitComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const openSubmitForm = (a) => {
    setActiveId(a.id);
    setSubmitFile(null);
    setSubmitComment(a.mySubmission?.comment || '');
  };

  const closeSubmitForm = () => {
    setActiveId(null);
    setSubmitFile(null);
    setSubmitComment('');
  };

  const handleSubmit = async (assignmentId) => {
    if (!submitFile) {
      toast.error('Please select a file to submit');
      return;
    }

    // 10MB check
    if (submitFile.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max 10MB.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', submitFile);
      if (submitComment.trim()) {
        formData.append('comment', submitComment.trim());
      }

      await api.post(`/assignments/${assignmentId}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Submitted successfully!');
      closeSubmitForm();
      fetchAssignments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const isPastDue = (dueDate) => new Date(dueDate) < new Date();

  const getStatusBadge = (a) => {
    if (a.status === 'graded') {
      return (
        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
          <CheckCircle size={11} />
          Graded
        </span>
      );
    }
    if (a.status === 'submitted') {
      return (
        <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
          <Clock size={11} />
          Submitted
        </span>
      );
    }
    if (isPastDue(a.due_date)) {
      return (
        <span className="bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
          <AlertCircle size={11} />
          Overdue
        </span>
      );
    }
    return (
      <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
        <Clock size={11} />
        Pending
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 border-b border-gray-100 pb-4">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <FileText size={20} className="text-purple-600" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900 text-lg">Assignments</h2>
          <p className="text-xs text-gray-500">
            Complete and submit your assignments before the due date
          </p>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-10">
          <FileText size={32} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-500">No assignments yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Your instructor hasn't posted any assignments
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="border border-gray-200 rounded-xl p-4 hover:border-purple-200 transition-colors"
            >
              {/* Title + Status */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-semibold text-gray-900 text-sm flex-1">
                  {a.title}
                </h3>
                {getStatusBadge(a)}
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-3 whitespace-pre-line">
                {a.description}
              </p>

              {/* Meta info */}
              <div className="flex items-center gap-3 flex-wrap text-xs mb-3">
                <span className={`flex items-center gap-1 ${isPastDue(a.due_date) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                  <Calendar size={11} />
                  Due: {formatDate(a.due_date)}
                </span>
                <span className="flex items-center gap-1 text-gray-500">
                  <Award size={11} />
                  Max marks: {a.max_marks}
                </span>
                {a.file_url && (
                  <a
                    href={`http://localhost:5000/uploads/assignments/${a.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-purple-600 hover:underline font-medium"
                  >
                    <FileText size={11} />
                    Download Instructions PDF
                  </a>
                )}
              </div>

              {/* Already Submitted - Display Submission Details */}
              {a.mySubmission && activeId !== a.id && (
                <div className={`border rounded-lg p-3 mt-3 ${a.isLate ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className={a.isLate ? 'text-red-600' : 'text-blue-600'} />
                      <span className={`text-xs font-semibold ${a.isLate ? 'text-red-700' : 'text-blue-700'}`}>
                        Submitted on {formatDate(a.mySubmission.submitted_at)}
                      </span>
                    </div>
                    {a.isLate && (
                      <span className="bg-red-200 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        LATE
                      </span>
                    )}
                  </div>

                  <a
                    href={`http://localhost:5000/uploads/submissions/${a.mySubmission.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:underline font-medium mb-2"
                  >
                    <Eye size={11} />
                    View Your Submission
                  </a>

                  {a.mySubmission.comment && (
                    <div className="text-xs text-gray-600 italic mt-2 flex items-start gap-1.5">
                      <MessageSquare size={11} className="mt-0.5 flex-shrink-0" />
                      <span>"{a.mySubmission.comment}"</span>
                    </div>
                  )}

                  {/* Grade Display */}
                  {a.mySubmission.marks !== null && (
                    <div className="bg-green-100 border border-green-300 rounded-lg p-3 mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <Award size={14} className="text-green-700" />
                          <span className="font-bold text-green-800 text-sm">
                            Grade: {a.mySubmission.marks} / {a.max_marks}
                          </span>
                        </div>
                        <span className="text-[10px] text-green-700 font-medium">
                          {((a.mySubmission.marks / a.max_marks) * 100).toFixed(0)}%
                        </span>
                      </div>
                      {a.mySubmission.feedback && (
                        <p className="text-xs text-green-800 mt-1 italic border-t border-green-200 pt-2">
                          <strong>Feedback:</strong> {a.mySubmission.feedback}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Resubmit button */}
                  <button
                    type="button"
                    onClick={() => openSubmitForm(a)}
                    className="mt-3 text-xs bg-white border border-purple-300 text-purple-700 px-3 py-1.5 rounded-lg font-medium hover:bg-purple-50 flex items-center gap-1.5"
                  >
                    <RefreshCw size={11} />
                    Resubmit
                  </button>
                </div>
              )}

              {/* Submit Form */}
              {activeId === a.id ? (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-3 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Upload File * (max 10MB)
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setSubmitFile(e.target.files[0])}
                      className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 cursor-pointer"
                    />
                    {submitFile && (
                      <p className="text-xs text-gray-500 mt-1">
                        Selected: {submitFile.name} ({(submitFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Comment (optional)
                    </label>
                    <textarea
                      rows={2}
                      value={submitComment}
                      onChange={(e) => setSubmitComment(e.target.value)}
                      placeholder="Any notes for your instructor..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSubmit(a.id)}
                      disabled={submitting || !submitFile}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {submitting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      <Upload size={11} />
                      {submitting ? 'Uploading...' : a.mySubmission ? 'Resubmit' : 'Submit'}
                    </button>
                    <button
                      type="button"
                      onClick={closeSubmitForm}
                      className="text-xs text-gray-600 hover:text-gray-800 px-3 py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // Show submit button only if no submission yet
                !a.mySubmission && (
                  <button
                    type="button"
                    onClick={() => openSubmitForm(a)}
                    className="mt-3 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                  >
                    <Upload size={14} />
                    Submit Assignment
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignmentsViewer;
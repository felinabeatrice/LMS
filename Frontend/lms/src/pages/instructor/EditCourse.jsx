
import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Plus, X, BookOpen } from 'lucide-react';
import api from '../../api/axios';

const EditCourse = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [categories,     setCategories]     = useState([]);
  const [originalStatus, setOriginalStatus] = useState('');
  const [form,           setForm]           = useState({
    title: '', description: '', category_id: '',
    duration: '', price: '', is_free: false,
  });
  const [outcomes,       setOutcomes]       = useState(['']);
  const [thumbnail,      setThumbnail]      = useState(null);
  const [video,          setVideo]          = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState('');
  const [success,        setSuccess]        = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [courseRes, catRes] = await Promise.all([
          api.get(`/courses/${id}`),
          api.get('/categories'),
        ]);
        const c = courseRes.data.course;
        setOriginalStatus(c.status);
        setForm({
          title:       c.title,
          description: c.description,
          category_id: c.category_id,
          duration:    c.duration,
          price:       c.price,
          is_free:     c.is_free,
        });
        // Parse existing outcomes
        if (c.learning_outcomes) {
          const parsed = c.learning_outcomes
            .split('\n')
            .filter((line) => line.trim());
          setOutcomes(parsed.length > 0 ? parsed : ['']);
        }
        setCategories(catRes.data.categories || []);
      } catch {
        setError('Failed to load course data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const addOutcome    = () => setOutcomes((prev) => [...prev, '']);
  const updateOutcome = (index, value) => {
    setOutcomes((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };
  const removeOutcome = (index) => {
    setOutcomes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const learningOutcomesStr = outcomes
        .filter((o) => o.trim())
        .join('\n');

      await api.put(`/courses/${id}`, {
        title:             form.title,
        description:       form.description,
        learning_outcomes: learningOutcomesStr || null,
        category_id:       parseInt(form.category_id),
        duration:          parseInt(form.duration),
        price:             form.is_free ? 0 : parseFloat(form.price),
        is_free:           form.is_free,
      });

      if (thumbnail) {
        setUploadingThumb(true);
        const thumbData = new FormData();
        thumbData.append('thumbnail', thumbnail);
        await api.post(
          `/courses/${id}/upload-thumbnail`,
          thumbData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        setUploadingThumb(false);
      }

      if (video) {
        setUploadingVideo(true);
        setUploadProgress(0);
        const videoData = new FormData();
        videoData.append('video', video);
        await api.post(
          `/courses/${id}/upload-video`,
          videoData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percent);
            },
          }
        );
        setUploadingVideo(false);
      }

      setSuccess('Course updated! Pending admin re-approval.');
      setTimeout(() => navigate('/instructor/courses'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.');
      setUploadingVideo(false);
      setUploadingThumb(false);
    } finally {
      setSaving(false);
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

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Course</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Update your course details below
        </p>
      </div>

      {/* Status banners */}
      {originalStatus === 'approved' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4
                        py-4 mb-6 flex items-start gap-3">
          <span className="text-xl flex-shrink-0">⚠️</span>
          <div>
            <p className="font-semibold text-amber-800 text-sm">
              This course is currently live and approved
            </p>
            <p className="text-amber-700 text-xs mt-1 leading-relaxed">
              Saving changes will temporarily set it back to pending review.
              Admin will need to re-approve before it goes public again.
            </p>
          </div>
        </div>
      )}
      {originalStatus === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4
                        py-3 mb-6 flex items-center gap-3">
          <X size={16} className="text-red-600 flex-shrink-0" />
          <p className="text-red-700 text-sm">
            This course was rejected. Fix the issues below and save to resubmit.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700
                        rounded-xl px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700
                        rounded-xl px-4 py-3 text-sm mb-6">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Course Title *
            </label>
            <input
              type="text" name="title" value={form.title}
              onChange={handleChange} required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg
                         text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description *
            </label>
            <textarea
              name="description" value={form.description}
              onChange={handleChange} required rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg
                         text-sm focus:outline-none focus:ring-2
                         focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Category *
              </label>
              <select
                name="category_id" value={form.category_id}
                onChange={handleChange} required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg
                           text-sm focus:outline-none focus:ring-2
                           focus:ring-blue-500 bg-white"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Duration (minutes) *
              </label>
              <input
                type="number" name="duration" value={form.duration}
                onChange={handleChange} required min={1}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg
                           text-sm focus:outline-none focus:ring-2
                           focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Pricing</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox" name="is_free"
              checked={form.is_free} onChange={handleChange}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              This is a free course
            </span>
          </label>
          {!form.is_free && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Price (USD) *
              </label>
              <input
                type="number" name="price" value={form.price}
                onChange={handleChange} required={!form.is_free}
                min={0.01} step={0.01}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg
                           text-sm focus:outline-none focus:ring-2
                           focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Media */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">
            Replace Media
            <span className="text-gray-400 font-normal text-xs ml-2">
              (leave empty to keep existing)
            </span>
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              New Thumbnail
            </label>
            <input
              type="file" accept="image/*"
              onChange={(e) => setThumbnail(e.target.files[0])}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2
                         file:px-4 file:rounded-lg file:border-0 file:text-sm
                         file:font-medium file:bg-blue-50 file:text-blue-700
                         hover:file:bg-blue-100 cursor-pointer"
            />
            {thumbnail && (
              <p className="text-xs text-gray-400 mt-1">
                Selected: {thumbnail.name}
              </p>
            )}
            {uploadingThumb && (
              <p className="text-xs text-blue-600 mt-1 animate-pulse">
                Uploading thumbnail...
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              New Video
              <span className="text-gray-400 font-normal ml-1">
                (MP4, WebM, MOV — max 100MB)
              </span>
            </label>
            <input
              type="file" accept="video/*"
              onChange={(e) => setVideo(e.target.files[0])}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2
                         file:px-4 file:rounded-lg file:border-0 file:text-sm
                         file:font-medium file:bg-purple-50 file:text-purple-700
                         hover:file:bg-purple-100 cursor-pointer"
            />
            {video && (
              <p className="text-xs text-gray-400 mt-1">
                Selected: {video.name}{' '}
                ({(video.size / (1024 * 1024)).toFixed(1)} MB)
              </p>
            )}
            {uploadingVideo && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Uploading video...</span>
                  <span className="font-medium text-blue-600">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all
                                duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                {uploadProgress === 100 && (
                  <p className="text-xs text-green-600 mt-1">Processing...</p>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Current status */}
        <div className="bg-white rounded-xl border border-gray-200 p-4
                        flex items-center justify-between">
          <span className="text-sm text-gray-600">Current Status</span>
          <span className={`text-xs px-3 py-1 rounded-full font-semibold capitalize
            ${originalStatus === 'approved'
              ? 'bg-green-100 text-green-700' :
            originalStatus === 'pending'
              ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'}`}>
            {originalStatus}
          </span>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Link to="/instructor/courses"
            className="px-5 py-2.5 text-sm text-gray-600 border border-gray-200
                       rounded-xl font-medium hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || uploadingVideo || uploadingThumb}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                       text-white px-6 py-2.5 rounded-xl text-sm font-semibold
                       transition-colors flex items-center gap-2"
          >
            {(saving || uploadingVideo || uploadingThumb) && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent
                              rounded-full animate-spin" />
            )}
            {uploadingVideo
              ? `Uploading ${uploadProgress}%`
              : uploadingThumb
                ? 'Uploading thumbnail...'
                : saving
                  ? 'Saving...'
                  : originalStatus === 'approved'
                    ? 'Save & Resubmit for Approval'
                    : 'Save Changes'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default EditCourse;
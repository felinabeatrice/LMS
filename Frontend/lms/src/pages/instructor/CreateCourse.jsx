import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, X, BookOpen } from 'lucide-react';
import api from '../../api/axios';

const CreateCourse = () => {
  const navigate = useNavigate();

  const [categories,     setCategories]     = useState([]);
  const [form,           setForm]           = useState({
    title: '', description: '', category_id: '',
    duration: '', price: '', is_free: false,
  });
  const [outcomes,       setOutcomes]       = useState(['']);
  const [thumbnail,      setThumbnail]      = useState(null);
  const [video,          setVideo]          = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');
  const [success,        setSuccess]        = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  useEffect(() => {
    api.get('/categories')
      .then((r) => setCategories(r.data.categories || []))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const addOutcome = () => setOutcomes((prev) => [...prev, '']);

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
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const learningOutcomesStr = outcomes
        .filter((o) => o.trim())
        .join('\n');

      const courseRes = await api.post('/courses', {
        title:             form.title,
        description:       form.description,
        learning_outcomes: learningOutcomesStr || null,
        category_id:       parseInt(form.category_id),
        duration:          parseInt(form.duration),
        price:             form.is_free ? 0 : parseFloat(form.price),
        is_free:           form.is_free,
      });

      const courseId = courseRes.data.course.id;

      if (thumbnail) {
        setUploadingThumb(true);
        const thumbData = new FormData();
        thumbData.append('thumbnail', thumbnail);
        await api.post(
          `/courses/${courseId}/upload-thumbnail`,
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
          `/courses/${courseId}/upload-video`,
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

      setSuccess('Course created! Waiting for admin approval.');
      setTimeout(() => navigate('/instructor/courses'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create course.');
      setUploadingVideo(false);
      setUploadingThumb(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create Course</h1>
        <p className="text-gray-500 text-sm mt-0.5">Fill in the details below</p>
      </div>

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
              placeholder="e.g. Complete React.js Course"
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
              placeholder="Describe what students will learn..."
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
                placeholder="e.g. 120"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg
                           text-sm focus:outline-none focus:ring-2
                           focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Learning Outcomes */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">
                What Students Will Learn
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Add bullet points that describe the learning outcomes
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {outcomes.map((outcome, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center
                                justify-center flex-shrink-0">
                  <BookOpen size={12} className="text-blue-600" />
                </div>
                <input
                  type="text"
                  value={outcome}
                  onChange={(e) => updateOutcome(index, e.target.value)}
                  placeholder={`Learning outcome ${index + 1}`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg
                             text-sm focus:outline-none focus:ring-2
                             focus:ring-blue-500"
                />
                {outcomes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeOutcome(index)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg
                               bg-red-50 text-red-500 hover:bg-red-100
                               transition-colors flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addOutcome}
            className="mt-3 flex items-center gap-2 text-sm text-blue-600
                       hover:text-blue-700 font-medium transition-colors"
          >
            <Plus size={16} />
            Add another point
          </button>
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
                min={0.01} step={0.01} placeholder="e.g. 29.99"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg
                           text-sm focus:outline-none focus:ring-2
                           focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Media */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Media</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Course Thumbnail
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
              Course Video
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

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Link to="/instructor/courses"
            className="px-5 py-2.5 text-sm text-gray-600 border border-gray-200
                       rounded-xl font-medium hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || uploadingVideo || uploadingThumb}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                       text-white px-6 py-2.5 rounded-xl text-sm font-semibold
                       transition-colors flex items-center gap-2"
          >
            {(loading || uploadingVideo || uploadingThumb) && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent
                              rounded-full animate-spin" />
            )}
            {uploadingVideo
              ? `Uploading ${uploadProgress}%`
              : uploadingThumb
                ? 'Uploading thumbnail...'
                : loading
                  ? 'Creating...'
                  : 'Create Course'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default CreateCourse;
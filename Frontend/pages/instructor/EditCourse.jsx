import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axios';

const EditCourse = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', category_id: '',
    duration: '', price: '', is_free: false,
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [video,     setVideo]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [courseRes, catRes] = await Promise.all([
          api.get(`/courses/${id}`),
          api.get('/categories'),
        ]);
        const c = courseRes.data.course;
        setForm({
          title:       c.title,
          description: c.description,
          category_id: c.category_id,
          duration:    c.duration,
          price:       c.price,
          is_free:     c.is_free,
        });
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
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.put(`/courses/${id}`, {
        title:       form.title,
        description: form.description,
        category_id: parseInt(form.category_id),
        duration:    parseInt(form.duration),
        price:       form.is_free ? 0 : parseFloat(form.price),
        is_free:     form.is_free,
      });
      if (thumbnail) {
        const thumbData = new FormData();
        thumbData.append('thumbnail', thumbnail);
        await api.post(`/courses/${id}/thumbnail`, thumbData,
          { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      if (video) {
        const videoData = new FormData();
        videoData.append('video', video);
        await api.post(`/courses/${id}/video`, videoData,
          { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setSuccess('Course updated. Pending re-approval.');
      setTimeout(() => navigate('/instructor/courses'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex items-center gap-4 mb-8">
          <Link to="/instructor/courses" className="text-gray-400 hover:text-gray-600 transition-colors text-xl">←</Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Course</h1>
            <p className="text-gray-500 text-sm mt-0.5">Changes require admin re-approval</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">{error}</div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm mb-6">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">Basic Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Course Title *</label>
              <input type="text" name="title" value={form.title} onChange={handleChange} required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
              <textarea name="description" value={form.description} onChange={handleChange} required rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                <select name="category_id" value={form.category_id} onChange={handleChange} required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (minutes) *</label>
                <input type="number" name="duration" value={form.duration} onChange={handleChange} required min={1}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Pricing</h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input type="checkbox" name="is_free" checked={form.is_free} onChange={handleChange} className="sr-only" />
                <div className={`w-10 h-6 rounded-full transition-colors ${form.is_free ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${form.is_free ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
              </div>
              <span className="text-sm font-medium text-gray-700">This is a free course</span>
            </label>
            {!form.is_free && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (USD) *</label>
                <input type="number" name="price" value={form.price} onChange={handleChange}
                  required={!form.is_free} min={0.01} step={0.01}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Replace Media (Optional)</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New Thumbnail</label>
              <input type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files[0])}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New Video</label>
              <input type="file" accept="video/*" onChange={(e) => setVideo(e.target.files[0])}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Link to="/instructor/courses"
              className="px-5 py-2.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-xl font-medium">
              Cancel
            </Link>
            <button type="submit" disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditCourse;
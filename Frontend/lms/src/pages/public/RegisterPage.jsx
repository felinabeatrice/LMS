import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'student',
  });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await register(
        form.name, form.email, form.password, form.role
      );

      if (form.role === 'instructor') {
        // Instructor must wait for approval
        setSuccess(data.message || 'Registered! Waiting for admin approval.');
        setForm({ name: '', email: '', password: '', role: 'student' });
      } else {
        // Student → go to login
        navigate('/login');
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        {/* ── Card ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center
                            justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
            <p className="text-gray-500 text-sm mt-1">
              Join LearnHub today
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700
                            rounded-lg px-4 py-3 text-sm mb-6">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700
                            rounded-lg px-4 py-3 text-sm mb-6">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg
                           text-sm focus:outline-none focus:ring-2
                           focus:ring-blue-500 focus:border-transparent
                           transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg
                           text-sm focus:outline-none focus:ring-2
                           focus:ring-blue-500 focus:border-transparent
                           transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg
                           text-sm focus:outline-none focus:ring-2
                           focus:ring-blue-500 focus:border-transparent
                           transition-all"
              />
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I want to join as
              </label>
              <div className="grid grid-cols-2 gap-3">

                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: 'student' })}
                  className={`px-4 py-3 rounded-xl border-2 text-sm font-medium
                              text-left transition-all
                              ${form.role === 'student'
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                              }`}
                >
                  <div className="text-lg mb-0.5">🎓</div>
                  <div>Student</div>
                  <div className="text-xs text-gray-400 font-normal mt-0.5">
                    Learn & enroll
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: 'instructor' })}
                  className={`px-4 py-3 rounded-xl border-2 text-sm font-medium
                              text-left transition-all
                              ${form.role === 'instructor'
                                ? 'border-purple-600 bg-purple-50 text-purple-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                              }`}
                >
                  <div className="text-lg mb-0.5">📚</div>
                  <div>Instructor</div>
                  <div className="text-xs text-gray-400 font-normal mt-0.5">
                    Teach & earn
                  </div>
                </button>

              </div>

              {/* Instructor warning */}
              {form.role === 'instructor' && (
                <p className="text-xs text-amber-600 mt-2 bg-amber-50
                              border border-amber-200 rounded-lg px-3 py-2">
                  ⚠️ Instructor accounts require admin approval before you can login.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                         text-white font-semibold py-2.5 rounded-lg text-sm
                         transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent
                                  rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>

          </form>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login"
              className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
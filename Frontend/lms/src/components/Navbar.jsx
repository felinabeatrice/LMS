import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Navbar = () => {
  const { user, logout, isAdmin, isInstructor, isStudent } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (isAdmin)      return '/admin/dashboard';
    if (isInstructor) return '/instructor/dashboard';
    if (isStudent)    return '/student/dashboard';
    return '/';
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* ── Logo ─────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center
                            justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Learn<span className="text-blue-600">Hub</span>
            </span>
          </Link>

          {/* ── Center links ─────────────────────────── */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/courses"
              className="text-gray-600 hover:text-blue-600 font-medium
                         text-sm transition-colors">
              Browse Courses
            </Link>
            {user && (
              <Link to={getDashboardLink()}
                className="text-gray-600 hover:text-blue-600 font-medium
                           text-sm transition-colors">
                Dashboard
              </Link>
            )}
          </div>

          {/* ── Right side ───────────────────────────── */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Role badge */}
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                  capitalize hidden sm:inline-block
                  ${isAdmin      ? 'bg-red-100    text-red-700'    : ''}
                  ${isInstructor ? 'bg-purple-100 text-purple-700' : ''}
                  ${isStudent    ? 'bg-green-100  text-green-700'  : ''}
                `}>
                  {user.role}
                </span>

                <span className="text-gray-700 font-medium text-sm
                                 hidden md:block truncate max-w-[120px]">
                  {user.name}
                </span>

                <button
                  onClick={handleLogout}
                  className="bg-gray-100 hover:bg-red-50 hover:text-red-600
                             text-gray-700 px-3 py-1.5 rounded-lg font-medium
                             text-sm transition-colors border border-gray-200">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login"
                  className="text-gray-700 hover:text-blue-600 font-medium
                             text-sm transition-colors">
                  Login
                </Link>
                <Link to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4
                             py-2 rounded-lg font-medium text-sm transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
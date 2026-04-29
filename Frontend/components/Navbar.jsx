import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Navbar = () => {
  const { user, logout, isAdmin, isInstructor, isStudent } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // ── Dashboard link based on role ───────────────────────
  const getDashboardLink = () => {
    if (isAdmin)      return '/admin/dashboard';
    if (isInstructor) return '/instructor/dashboard';
    if (isStudent)    return '/student/dashboard';
    return '/';
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600">
              LearnHub
            </span>
          </Link>

          {/* Center nav links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/courses"
              className="text-gray-600 hover:text-blue-600
                         font-medium transition-colors"
            >
              Courses
            </Link>

            {user && (
              <Link
                to={getDashboardLink()}
                className="text-gray-600 hover:text-blue-600
                           font-medium transition-colors"
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Role badge */}
                <span className={`
                  px-3 py-1 rounded-full text-xs font-semibold capitalize
                  ${isAdmin      ? 'bg-red-100 text-red-700'    : ''}
                  ${isInstructor ? 'bg-purple-100 text-purple-700' : ''}
                  ${isStudent    ? 'bg-green-100 text-green-700' : ''}
                `}>
                  {user.role}
                </span>

                {/* User name */}
                <span className="text-gray-700 font-medium text-sm hidden md:block">
                  {user.name}
                </span>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="bg-gray-100 hover:bg-red-50 hover:text-red-600
                             text-gray-700 px-4 py-2 rounded-lg font-medium
                             text-sm transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600
                             font-medium text-sm transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white
                             px-4 py-2 rounded-lg font-medium text-sm
                             transition-colors"
                >
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
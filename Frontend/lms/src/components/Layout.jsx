import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, BookOpen, LogOut, LayoutDashboard } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import Sidebar from './Sidebar';

const BackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const noBtnRoutes = [
    '/admin/dashboard',
    '/instructor/dashboard',
    '/student/dashboard',
  ];

  if (noBtnRoutes.includes(location.pathname)) return null;

  return (
    <button
      onClick={() => navigate(-1)}
      className="inline-flex items-center gap-1.5 text-sm text-gray-500
                 hover:text-blue-600 transition-colors font-medium mb-5"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor"
        viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 19l-7-7 7-7" />
      </svg>
      Back
    </button>
  );
};

const PublicNavbar = () => {
  const { user, logout, isAdmin, isInstructor, isStudent } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isHomePage = location.pathname === '/';

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

  const scrollTo = (id) => {
    setMenuOpen(false);
    if (!isHomePage) {
      navigate('/');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinks = [
    { label: 'Services',  id: 'services'  },
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'FAQ',       id: 'faq'       },
    { label: 'Contact',   id: 'contact'   },
    { label: 'About',     id: 'about'     },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center
                            justify-center shadow-sm">
              <BookOpen size={16} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Learn<span className="text-blue-600">Hub</span>
            </span>
          </Link>

          {/* Desktop center links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="px-3 py-2 text-sm text-gray-600 hover:text-blue-600
                           hover:bg-blue-50 rounded-lg font-medium transition-colors"
              >
                {link.label}
              </button>
            ))}
            <Link
              to="/courses"
              className="px-3 py-2 text-sm text-gray-600 hover:text-blue-600
                         hover:bg-blue-50 rounded-lg font-medium transition-colors"
            >
              Courses
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to={getDashboardLink()}
                  className="hidden sm:flex items-center gap-1.5 text-sm
                             text-gray-700 hover:text-blue-600 font-medium
                             transition-colors"
                >
                  <LayoutDashboard size={15} />
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden sm:flex items-center gap-1.5 bg-gray-100
                             hover:bg-red-50 hover:text-red-600 text-gray-700
                             px-3 py-1.5 rounded-lg font-medium text-sm
                             transition-colors border border-gray-200"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login"
                  className="hidden sm:block text-gray-700 hover:text-blue-600
                             font-medium text-sm transition-colors">
                  Login
                </Link>
                <Link to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2
                             rounded-lg font-medium text-sm transition-colors">
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center
                         rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Menu size={18} className="text-gray-700" />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-600
                           hover:text-blue-600 hover:bg-blue-50 rounded-lg
                           font-medium transition-colors"
              >
                {link.label}
              </button>
            ))}
            <Link
              to="/courses"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm text-gray-600
                         hover:text-blue-600 hover:bg-blue-50 rounded-lg
                         font-medium transition-colors"
            >
              Courses
            </Link>
            <div className="pt-2 border-t border-gray-100 mt-2">
              {user ? (
                <>
                  <Link
                    to={getDashboardLink()}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-gray-700
                               hover:bg-gray-50 rounded-lg font-medium"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600
                               hover:bg-red-50 rounded-lg font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-gray-700
                               hover:bg-gray-50 rounded-lg font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-blue-600
                               hover:bg-blue-50 rounded-lg font-medium"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user }  = useAuth();

  const publicPaths = ['/', '/login', '/register', '/courses'];
  const isPublicRoute =
    publicPaths.includes(location.pathname) ||
    location.pathname.startsWith('/courses/');

  if (!user || isPublicRoute) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PublicNavbar />
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden bg-white border-b border-gray-200
                           px-4 py-3 flex items-center gap-3 flex-shrink-0 shadow-sm">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg
                       bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            <Menu size={18} />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center
                            justify-center">
              <BookOpen size={14} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-base">
              Learn<span className="text-blue-600">Hub</span>
            </span>
          </Link>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <BackButton />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
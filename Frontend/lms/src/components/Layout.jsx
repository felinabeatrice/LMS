import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import useAuth from '../hooks/useAuth';

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user }   = useAuth();

  // Public routes — no sidebar
  const publicRoutes = ['/', '/login', '/register', '/courses'];
  const isPublic = publicRoutes.includes(location.pathname) ||
    location.pathname.startsWith('/courses/');

  // Not logged in — always public layout
  if (!user || isPublic) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Top Navbar for public pages */}
        <PublicNavbar />
        <main>{children}</main>
      </div>
    );
  }

  // Logged in — sidebar layout
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile top bar */}
        <header className="lg:hidden bg-white border-b border-gray-200
                           px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg
                       bg-gray-100 hover:bg-gray-200 text-gray-700
                       transition-colors"
          >
            ☰
          </button>
          <span className="font-bold text-gray-900">
            Learn<span className="text-blue-600">Hub</span>
          </span>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          {/* Back button + page content */}
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Back button on every page */}
            <BackBtn />
            {children}
          </div>
        </main>

      </div>
    </div>
  );
};

// ── Back button shown on every authenticated page ──────────
const BackBtn = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Don't show on dashboard home pages
  const noBtnRoutes = [
    '/admin/dashboard',
    '/instructor/dashboard',
    '/student/dashboard',
  ];
  if (noBtnRoutes.includes(location.pathname)) return null;

  return (
    <button
      onClick={() => navigate(-1)}
      className="inline-flex items-center gap-2 text-sm text-gray-500
                 hover:text-blue-600 transition-colors font-medium mb-4"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 19l-7-7 7-7" />
      </svg>
      Back
    </button>
  );
};

// ── Public top navbar ──────────────────────────────────────
const PublicNavbar = () => {
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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center
                            justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Learn<span className="text-blue-600">Hub</span>
            </span>
          </a>

          {/* Links */}
          <div className="hidden md:flex items-center gap-6">
            <a href="/courses"
              className="text-gray-600 hover:text-blue-600 font-medium text-sm">
              Browse Courses
            </a>
            {user && (
              <a href={getDashboardLink()}
                className="text-gray-600 hover:text-blue-600 font-medium text-sm">
                Dashboard
              </a>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-gray-700 font-medium text-sm hidden md:block">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-gray-100 hover:bg-red-50 hover:text-red-600
                             text-gray-700 px-3 py-1.5 rounded-lg font-medium
                             text-sm transition-colors border border-gray-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <a href="/login"
                  className="text-gray-700 hover:text-blue-600 font-medium text-sm">
                  Login
                </a>
                <a href="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2
                             rounded-lg font-medium text-sm transition-colors">
                  Get Started
                </a>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Layout;
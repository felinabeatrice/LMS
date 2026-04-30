import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// ── Nav item component ─────────────────────────────────────
const NavItem = ({ to, icon, label, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to ||
    location.pathname.startsWith(to + '/');

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl
                   text-sm font-medium transition-colors text-gray-400
                   hover:bg-red-50 hover:text-red-600"
      >
        <span className="text-lg">{icon}</span>
        {label}
      </button>
    );
  }

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm
                  font-medium transition-colors
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </Link>
  );
};

// ── Role badge colors ──────────────────────────────────────
const roleBadge = {
  admin:      { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Admin'      },
  instructor: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Instructor' },
  student:    { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Student'    },
};

const Sidebar = ({ mobileOpen, onClose }) => {
  const { user, logout, isAdmin, isInstructor, isStudent } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // ── Build nav links based on role ─────────────────────
  const getNavLinks = () => {
    if (isAdmin) return [
      { to: '/admin/dashboard',        icon: '🏠', label: 'Dashboard'       },
      { to: '/admin/users',            icon: '👥', label: 'Manage Users'    },
      { to: '/admin/courses/pending',  icon: '📋', label: 'Pending Courses' },
      { to: '/admin/payments',         icon: '💳', label: 'All Payments'    },
      { to: '/courses',                icon: '🌐', label: 'Browse Courses'  },
    ];
    if (isInstructor) return [
      { to: '/instructor/dashboard',         icon: '🏠', label: 'Dashboard'     },
      { to: '/instructor/courses',           icon: '📚', label: 'My Courses'    },
      { to: '/instructor/courses/create',    icon: '✏️',  label: 'Create Course' },
      { to: '/courses',                      icon: '🌐', label: 'Browse Courses'},
    ];
    if (isStudent) return [
      { to: '/student/dashboard',    icon: '🏠', label: 'Dashboard'      },
      { to: '/student/enrollments',  icon: '📖', label: 'My Enrollments' },
      { to: '/student/payments',     icon: '💳', label: 'My Payments'    },
      { to: '/courses',              icon: '🌐', label: 'Browse Courses' },
    ];
    return [];
  };

  const navLinks = getNavLinks();
  const badge    = roleBadge[user?.role] || roleBadge.student;

  // ── Sidebar content ────────────────────────────────────
  const sidebarContent = (
    <div className="flex flex-col h-full">

      {/* ── Logo ──────────────────────────────────────── */}
      <div className="px-5 py-5 border-b border-gray-100">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center
                          justify-center flex-shrink-0">
            <span className="text-white font-bold text-base">L</span>
          </div>
          <span className="text-lg font-bold text-gray-900">
            Learn<span className="text-blue-600">Hub</span>
          </span>
        </Link>
      </div>

      {/* ── User Profile ──────────────────────────────── */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500
                          to-indigo-600 flex items-center justify-center
                          flex-shrink-0">
            <span className="text-white font-bold text-sm">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {user?.name}
            </p>
            <p className="text-gray-400 text-xs truncate">{user?.email}</p>
          </div>
        </div>

        {/* Role + Approval badges */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold
                            capitalize ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>

          {/* Instructor approval status */}
          {isInstructor && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold
              ${user?.is_approved
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
              }`}>
              {user?.is_approved ? '✅ Approved' : '⏳ Pending'}
            </span>
          )}

          {/* Admin badge */}
          {isAdmin && (
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold
                             bg-red-100 text-red-700">
              Full Access
            </span>
          )}
        </div>
      </div>

      {/* ── Navigation Links ──────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navLinks.map((link) => (
          <NavItem
            key={link.to}
            to={link.to}
            icon={link.icon}
            label={link.label}
          />
        ))}
      </nav>

      {/* ── Logout Button ─────────────────────────────── */}
      <div className="px-3 py-4 border-t border-gray-100">
        <NavItem
          icon="🚪"
          label="Logout"
          onClick={handleLogout}
        />
      </div>

    </div>
  );

  return (
    <>
      {/* ── MOBILE OVERLAY ──────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* ── DESKTOP SIDEBAR ─────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 bg-white
                        border-r border-gray-200 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* ── MOBILE SIDEBAR (slide in) ───────────────── */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out lg:hidden
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center
                     justify-center rounded-lg bg-gray-100 hover:bg-gray-200
                     text-gray-600 transition-colors"
        >
          ✕
        </button>
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;

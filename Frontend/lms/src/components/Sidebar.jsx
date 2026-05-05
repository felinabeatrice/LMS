import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Users, ClipboardList, CreditCard, Globe,
  BookOpen, PlusCircle, BookMarked, Wallet, LogOut,
  ChevronRight, FolderOpen, Megaphone, MessageSquare,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';

const NavItem = ({ to, icon: Icon, label, onClick }) => {
  const location = useLocation();
  const isActive = to
    ? location.pathname === to ||
      (to !== '/' && location.pathname.startsWith(to + '/'))
    : false;

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl
                   text-sm font-medium transition-colors text-gray-500
                   hover:bg-red-50 hover:text-red-600"
      >
        <Icon size={18} />
        {label}
      </button>
    );
  }

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm
                  font-medium transition-all duration-150
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
    >
      <Icon size={18} />
      <span className="flex-1">{label}</span>
      {isActive && <ChevronRight size={14} />}
    </Link>
  );
};

const Sidebar = ({ mobileOpen, onClose }) => {
  const { user, logout, isAdmin, isInstructor, isStudent } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => { onClose(); }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getNavLinks = () => {
    if (isAdmin) return [
  { to: '/admin/dashboard',       icon: Home,          label: 'Dashboard'        },
  { to: '/admin/users',           icon: Users,         label: 'Manage Users'     },
  { to: '/admin/courses/pending', icon: ClipboardList, label: 'Pending Courses'  },
  { to: '/admin/payments',        icon: CreditCard,    label: 'All Payments'     },
  { to: '/admin/categories',      icon: FolderOpen,    label: 'Categories'       },
  { to: '/admin/announcements',   icon: Megaphone,     label: 'Announcements'    },
  { to: '/courses',               icon: Globe,         label: 'Browse Courses'   },
];
    if (isInstructor) return [
      { to: '/instructor/dashboard',      icon: Home,       label: 'Dashboard'      },
      { to: '/instructor/courses',        icon: BookOpen,   label: 'My Courses'     },
      { to: '/instructor/courses/create', icon: PlusCircle, label: 'Create Course'  },
      { to: '/courses',                   icon: Globe,      label: 'Browse Courses' },
    ];
    if (isStudent) return [
  { to: '/student/dashboard',   icon: Home,          label: 'Dashboard'      },
  { to: '/student/enrollments', icon: BookMarked,    label: 'My Enrollments' },
  { to: '/student/messages',    icon: MessageSquare, label: 'My Messages'    },
  { to: '/student/payments',    icon: Wallet,        label: 'My Payments'    },
  { to: '/courses',             icon: Globe,         label: 'Browse Courses' },
  ];
    return [];
  };

  const navLinks = getNavLinks();

  const roleBadge = () => {
    if (isAdmin)      return { label: 'Admin',      bg: 'bg-red-100',    text: 'text-red-700'    };
    if (isInstructor) return { label: 'Instructor',  bg: 'bg-purple-100', text: 'text-purple-700' };
    return               { label: 'Student',     bg: 'bg-green-100',  text: 'text-green-700'  };
  };

  const badge = roleBadge();

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center
                          justify-center flex-shrink-0 shadow-sm">
            <BookOpen size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">
            Learn<span className="text-blue-600">Hub</span>
          </span>
        </Link>
      </div>

      {/* User Profile */}
      <div className="px-4 py-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500
                          to-indigo-600 flex items-center justify-center
                          flex-shrink-0 shadow-sm">
            <span className="text-white font-bold text-sm">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {user?.name}
            </p>
            <p className="text-gray-400 text-xs truncate">{user?.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold
                            ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
          {isInstructor && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold
              ${user?.is_approved
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'}`}>
              {user?.is_approved ? 'Approved' : 'Pending'}
            </span>
          )}
          {isAdmin && (
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold
                             bg-red-100 text-red-700">
              Full Access
            </span>
          )}
        </div>
      </div>

      {/* Nav Links */}
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

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-100 flex-shrink-0">
        <NavItem
          icon={LogOut}
          label="Logout"
          onClick={handleLogout}
        />
      </div>
    </div>
  );

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Desktop */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 bg-white
                        border-r border-gray-200 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-72 bg-white
                         border-r border-gray-200 transform transition-transform
                         duration-300 ease-in-out lg:hidden
                         ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center
                     justify-center rounded-lg bg-gray-100 hover:bg-gray-200
                     text-gray-600 transition-colors z-10"
        >
          ✕
        </button>
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;
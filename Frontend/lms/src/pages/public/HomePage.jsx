import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

// ── Stat card ──────────────────────────────────────────────
const StatCard = ({ number, label }) => (
  <div className="text-center">
    <div className="text-3xl font-bold text-blue-600">{number}</div>
    <div className="text-sm text-gray-500 mt-1">{label}</div>
  </div>
);

// ── Feature card ───────────────────────────────────────────
const FeatureCard = ({ icon, title, desc }) => (
  <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm
                  hover:shadow-md transition-shadow">
    <div className="text-3xl mb-3">{icon}</div>
    <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

// ── Role card ──────────────────────────────────────────────
const RoleCard = ({ icon, title, desc, color, link, linkText }) => (
  <div className={`rounded-xl p-6 border-2 ${color}`}>
    <div className="text-3xl mb-3">{icon}</div>
    <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
    <p className="text-gray-600 text-sm mb-4 leading-relaxed">{desc}</p>
    <Link to={link}
      className="inline-block bg-white text-gray-800 px-4 py-2 rounded-lg
                 text-sm font-medium hover:bg-gray-50 transition-colors
                 border border-gray-200">
      {linkText}
    </Link>
  </div>
);

const HomePage = () => {
  const { user, isAdmin, isInstructor, isStudent } = useAuth();

  const getDashboardLink = () => {
    if (isAdmin)      return '/admin/dashboard';
    if (isInstructor) return '/instructor/dashboard';
    if (isStudent)    return '/student/dashboard';
    return '/register';
  };

  const getDashboardText = () => {
    if (user) return 'Go to Dashboard';
    return 'Get Started Free';
  };

  return (
    <div className="bg-gray-50">

      {/* ── HERO ──────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-3xl mx-auto">

            <span className="inline-block bg-blue-50 text-blue-700 text-sm
                             font-medium px-4 py-1.5 rounded-full mb-6 border
                             border-blue-100">
              🎓 Production-grade Learning Platform
            </span>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900
                           leading-tight mb-6">
              Learn Without{' '}
              <span className="text-blue-600">Limits</span>
            </h1>

            <p className="text-lg text-gray-500 mb-8 leading-relaxed">
              Access expert-led courses, grow your skills, and advance your career.
              Join thousands of learners and instructors on LearnHub.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to={getDashboardLink()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold
                           px-8 py-3 rounded-xl text-base transition-colors"
              >
                {getDashboardText()}
              </Link>
              <Link
                to="/courses"
                className="bg-white hover:bg-gray-50 text-gray-700 font-semibold
                           px-8 py-3 rounded-xl text-base border border-gray-200
                           transition-colors"
              >
                Browse Courses
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            <StatCard number="10K+"  label="Students enrolled" />
            <StatCard number="500+"  label="Expert courses"     />
            <StatCard number="200+"  label="Instructors"        />
            <StatCard number="4.8★"  label="Average rating"     />
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Everything you need to learn
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            A complete platform built for modern learners and instructors
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon="🎥"
            title="HD Video Lessons"
            desc="Watch high-quality video content at your own pace, anytime and anywhere."
          />
          <FeatureCard
            icon="📂"
            title="Organized Courses"
            desc="Well-structured courses with categories, descriptions, and clear duration."
          />
          <FeatureCard
            icon="⭐"
            title="Ratings & Reviews"
            desc="Make informed decisions with honest ratings from verified enrolled students."
          />
          <FeatureCard
            icon="💳"
            title="Easy Enrollment"
            desc="Enroll in free courses instantly or unlock paid content with one click."
          />
          <FeatureCard
            icon="🏆"
            title="Expert Instructors"
            desc="Learn from approved, qualified instructors vetted by our admin team."
          />
          <FeatureCard
            icon="📊"
            title="Track Progress"
            desc="Monitor your enrollments, payments, and learning journey from your dashboard."
          />
        </div>
      </section>

      {/* ── ROLES ─────────────────────────────────────── */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Who is LearnHub for?
            </h2>
            <p className="text-gray-500">
              A platform built for every role in the learning journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RoleCard
              icon="🎓"
              title="Students"
              desc="Browse hundreds of courses, enroll for free or paid access, watch videos, and rate your experience."
              color="border-green-200 bg-green-50"
              link="/register"
              linkText="Join as Student"
            />
            <RoleCard
              icon="📚"
              title="Instructors"
              desc="Create and publish courses, upload video content, and reach thousands of eager learners."
              color="border-purple-200 bg-purple-50"
              link="/register"
              linkText="Become Instructor"
            />
            <RoleCard
              icon="🛡️"
              title="Admins"
              desc="Manage the platform, approve instructors, review courses, and oversee all payments."
              color="border-red-200 bg-red-50"
              link="/login"
              linkText="Admin Login"
            />
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      {!user && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-blue-600 rounded-2xl p-10 text-center">
            <h2 className="text-3xl font-bold text-white mb-3">
              Ready to start learning?
            </h2>
            <p className="text-blue-100 mb-8 max-w-lg mx-auto">
              Create your free account today and get instant access to hundreds of courses.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/register"
                className="bg-white text-blue-600 font-semibold px-8 py-3
                           rounded-xl text-base hover:bg-blue-50 transition-colors"
              >
                Create Free Account
              </Link>
              <Link
                to="/courses"
                className="bg-blue-700 hover:bg-blue-800 text-white font-semibold
                           px-8 py-3 rounded-xl text-base transition-colors
                           border border-blue-500"
              >
                Browse Courses
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between
                          items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center
                              justify-center">
                <span className="text-white font-bold text-xs">L</span>
              </div>
              <span className="font-bold text-gray-900">
                Learn<span className="text-blue-600">Hub</span>
              </span>
            </div>
            <p className="text-sm text-gray-400">
              © 2026 LearnHub. Built with PERN stack.
            </p>
            <div className="flex gap-4 text-sm text-gray-500">
              <Link to="/courses" className="hover:text-blue-600 transition-colors">
                Courses
              </Link>
              <Link to="/login" className="hover:text-blue-600 transition-colors">
                Login
              </Link>
              <Link to="/register" className="hover:text-blue-600 transition-colors">
                Register
              </Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;
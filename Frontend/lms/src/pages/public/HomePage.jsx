import { useState } from 'react';
import { Link }     from 'react-router-dom';
import {
  BookOpen, Users, Award, Star, ChevronDown, ChevronUp,
  Mail, Phone, ArrowRight, CheckCircle, Zap, Shield,
  TrendingUp, GraduationCap, Send, Play,
} from 'lucide-react';
import api        from '../../api/axios';
import useAuth    from '../../hooks/useAuth';
import contactImg from '../../assets/contact.jpg';
import heroImage  from '../../assets/hero.png';

// ── Section heading ────────────────────────────────────────
const SectionHeading = ({ badge, title, subtitle }) => (
  <div className="text-center mb-12">
    {badge && (
      <span className="inline-block bg-blue-50 text-blue-600 text-xs
                       font-semibold px-3 py-1.5 rounded-full mb-4
                       border border-blue-100">
        {badge}
      </span>
    )}
    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
      {title}
    </h2>
    {subtitle && (
      <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">
        {subtitle}
      </p>
    )}
  </div>
);

// ── FAQ item ───────────────────────────────────────────────
const FAQItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-xl transition-all duration-200
      ${open ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <span className={`font-semibold text-sm sm:text-base
          ${open ? 'text-blue-700' : 'text-gray-900'}`}>
          {question}
        </span>
        <span className={`flex-shrink-0 ml-4 transition-transform duration-200
          ${open ? 'text-blue-600' : 'text-gray-400'}`}>
          {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </span>
      </button>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-gray-600 text-sm leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
};

const HomePage = () => {
  const { user, isAdmin, isInstructor, isStudent } = useAuth();

  const [contactForm,    setContactForm]    = useState({
    name: '', email: '', message: '',
  });
  const [contactSent,    setContactSent]    = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError,   setContactError]   = useState('');

  const getDashboardLink = () => {
    if (isAdmin)      return '/admin/dashboard';
    if (isInstructor) return '/instructor/dashboard';
    if (isStudent)    return '/student/dashboard';
    return '/register';
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactLoading(true);
    setContactError('');
    try {
      await api.post('/contact', contactForm);
      setContactSent(true);
      setContactForm({ name: '', email: '', message: '' });
    } catch (err) {
      setContactError(
        err.response?.data?.message || 'Failed to send. Please try again.'
      );
    } finally {
      setContactLoading(false);
    }
  };

  const faqItems = [
    {
      question: 'How do I enroll in a course?',
      answer: 'Browse our course catalog, click on any course, and click "Enroll Now". Free courses give instant access. For paid courses, complete the payment to unlock content.',
    },
    {
      question: 'Can I access course content after completing it?',
      answer: 'Yes! Once enrolled, you have lifetime access to the course content. You can revisit lessons and re-watch videos at any time.',
    },
    {
      question: 'How do instructors get approved?',
      answer: 'After registering as an instructor, your application is reviewed by our admin team. Once approved, you can create and publish courses. This typically takes 24-48 hours.',
    },
    {
      question: 'What happens if I enroll in a paid course?',
      answer: 'After enrolling, you will see a payment option. Complete the payment to gain full access to all course videos and materials.',
    },
    {
      question: 'Can I rate a course?',
      answer: 'Yes! After enrolling and gaining access, you can submit a star rating (1-5) and a written review. You can also edit your rating at any time.',
    },
    {
      question: 'How do I become an instructor?',
      answer: 'Register on LearnHub and select "Instructor" as your role. Submit your application and wait for admin approval. Once approved, start creating courses immediately.',
    },
    {
      question: 'Are there free courses available?',
      answer: 'Absolutely! Many instructors offer free courses. You can filter courses by "Free" on the courses page. Free courses give instant access upon enrollment.',
    },
    {
      question: 'Can I cancel my enrollment?',
      answer: 'Yes, you can cancel your enrollment from your "My Enrollments" page. Note that cancellation removes your access to the course content.',
    },
    {
      question: 'What video formats are supported?',
      answer: 'Instructors can upload videos in MP4, WebM, and MOV formats, up to 100MB per video. All videos are streamed securely and support seeking.',
    },
    {
      question: 'How are courses reviewed before publishing?',
      answer: 'All courses go through an admin review process before they are published publicly. Admins check for quality and appropriateness. Instructors are notified when their course is approved or rejected.',
    },
  ];

  const services = [
    {
      icon: BookOpen, title: 'Expert-Led Courses',
      desc: 'Learn from approved, qualified instructors who bring real-world experience to every lesson.',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      icon: Play, title: 'HD Video Content',
      desc: 'Watch high-quality video lessons with full seeking support, at your own pace.',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      icon: Star, title: 'Ratings & Reviews',
      desc: 'Make informed decisions with honest ratings from verified enrolled students.',
      color: 'bg-amber-50 text-amber-600',
    },
    {
      icon: Shield, title: 'Secure Access Control',
      desc: 'Your course access is protected. Paid content is locked until payment is verified.',
      color: 'bg-green-50 text-green-600',
    },
    {
      icon: Zap, title: 'Instant Enrollment',
      desc: 'Enroll in free courses instantly. Paid courses unlock the moment payment is confirmed.',
      color: 'bg-red-50 text-red-600',
    },
    {
      icon: TrendingUp, title: 'Track Your Progress',
      desc: 'Monitor your enrollments, payments, and learning journey from your personal dashboard.',
      color: 'bg-indigo-50 text-indigo-600',
    },
  ];

  return (
    <div className="bg-white">

      {/* ── HERO ──────────────────────────────────────────── */}
      {/* ── HERO ──────────────────────────────────────────── */}
<section
  className="relative overflow-hidden text-white bg-cover bg-center"
  style={{ backgroundImage: `url(${heroImage})` }}
>
<div className="absolute inset-0 bg-black/40" />
  {/* Decorative blurs */}
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5
                    rounded-full blur-3xl" />
    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5
                    rounded-full blur-3xl" />
  </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
                        py-20 sm:py-28 lg:py-36">
          <div className="text-center max-w-4xl mx-auto">

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold
                           leading-tight mb-6">
              Learn Without{' '}
              <span className="text-blue-200">Limits</span>
            </h1>

            <p className="text-lg sm:text-xl text-blue-100 mb-10
                          max-w-2xl mx-auto leading-relaxed">
              Access expert-led courses, grow your skills, and advance your
              career. Join thousands of learners and instructors on LearnHub.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={user ? getDashboardLink() : '/register'}
                className="inline-flex items-center justify-center gap-2
                           bg-white text-blue-700 font-bold px-8 py-4
                           rounded-xl hover:bg-blue-50 transition-colors
                           shadow-lg text-base"
              >
                {user ? 'Go to Dashboard' : 'Start Learning Free'}
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/courses"
                className="inline-flex items-center justify-center gap-2
                           bg-white/10 backdrop-blur-sm border border-white/20
                           text-white font-semibold px-8 py-4 rounded-xl
                           hover:bg-white/20 transition-colors text-base"
              >
                <BookOpen size={18} />
                Browse Courses
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 pt-16
                            border-t border-white/20 max-w-lg mx-auto">
              {[
                { value: '10K+', label: 'Students' },
                { value: '500+', label: 'Courses'  },
                { value: '4.8★', label: 'Rating'   },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold">
                    {s.value}
                  </div>
                  <div className="text-blue-200 text-sm mt-1">{s.label}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── ABOUT US ──────────────────────────────────────── */}
     {/* ── ABOUT US ──────────────────────────────────────── */}
<section id="about" className="py-20 bg-gray-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

    <SectionHeading
      title="We Are Dedicated to Quality Education"
      subtitle="LearnHub is a production-grade Learning Management System built
                to connect passionate learners with expert instructors around
                the world. We believe that quality education should be
                accessible, structured, and effective."
    />

    <div className="max-w-3xl mx-auto text-center mb-12">
      <p className="text-gray-500 leading-relaxed text-lg">
        Our platform supports a complete learning ecosystem — from course
        creation and admin approval, to enrollment, payments, video streaming,
        and ratings. Every feature is designed with both instructors and
        students in mind.
      </p>
    </div>

    {/* Stats grid */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto">
      {[
        {
          icon: GraduationCap,
          value: '10,000+',
          label: 'Students Enrolled',
          color: 'bg-blue-50 text-blue-600',
        },
        {
          icon: BookOpen,
          value: '500+',
          label: 'Expert Courses',
          color: 'bg-purple-50 text-purple-600',
        },
        {
          icon: Users,
          value: '200+',
          label: 'Instructors',
          color: 'bg-green-50 text-green-600',
        },
        {
          icon: Award,
          value: '4.8★',
          label: 'Average Rating',
          color: 'bg-amber-50 text-amber-600',
        },
      ].map((item) => (
        <div key={item.label}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm
                     p-6 text-center hover:shadow-md transition-shadow">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center
                           mx-auto mb-4 ${item.color}`}>
            <item.icon size={26} />
          </div>
          <div className="text-3xl font-extrabold text-gray-900 mb-1">
            {item.value}
          </div>
          <div className="text-sm text-gray-500 font-medium">
            {item.label}
          </div>
        </div>
      ))}
    </div>

  </div>
</section>

      {/* ── SERVICES ──────────────────────────────────────── */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Everything You Need to Learn"
            subtitle="A complete platform built for modern learners and instructors,
                      with all the tools you need to succeed."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <div key={s.title}
                className="bg-gray-50 rounded-2xl p-6 border border-gray-100
                           shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl flex items-center
                                 justify-center mb-4 ${s.color}`}>
                  <s.icon size={22} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">
                  {s.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Frequently Asked Questions"
            subtitle="Everything you need to know about LearnHub."
          />
          <div className="space-y-3">
            {faqItems.map((item) => (
              <FAQItem
                key={item.question}
                question={item.question}
                answer={item.answer}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ───────────────────────────────────────── */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Contact Us"
            subtitle="Have a question or need help? We are here for you."
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12
                          max-w-5xl mx-auto items-center">

            {/* Left — Image */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl
                            h-[420px] sm:h-[480px]">
              <img
                src={contactImg}
                alt="Contact LearnHub"
                className="w-full h-full object-cover"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t
                              from-blue-900/70 via-transparent to-transparent
                              flex items-end p-8">
                <div className="text-white">
                  <h3 className="text-2xl font-bold mb-2">Let's Talk</h3>
                  <p className="text-blue-100 text-sm leading-relaxed">
                    We typically respond within 24 hours.
                    Our team is happy to help you with anything.
                  </p>
                  <div className="flex flex-col gap-2 mt-4">
                    <div className="flex items-center gap-2 text-blue-100 text-sm">
                      <Mail size={14} />
                      contact@learnhub.com
                    </div>
                    <div className="flex items-center gap-2 text-blue-100 text-sm">
                      <Phone size={14} />
                      +1 (555) 123-4567
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Contact form */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8">
              {contactSent ? (
                <div className="h-full flex flex-col items-center
                                justify-center text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex
                                  items-center justify-center mb-4">
                    <CheckCircle size={32} className="text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-gray-500 text-sm mb-6">
                    Thank you for reaching out. We will get back to
                    you within 24 hours.
                  </p>
                  <button
                    onClick={() => setContactSent(false)}
                    className="text-blue-600 hover:text-blue-700 text-sm
                               font-medium"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-5">
                  <h3 className="font-bold text-gray-900 text-xl mb-2">
                    Send us a message
                  </h3>

                  {contactError && (
                    <div className="bg-red-50 border border-red-200
                                    text-red-700 rounded-xl px-4 py-3 text-sm">
                      {contactError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium
                                      text-gray-700 mb-1.5">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({
                        ...contactForm, name: e.target.value,
                      })}
                      placeholder="John Doe"
                      className="w-full px-4 py-2.5 border border-gray-300
                                 rounded-lg text-sm focus:outline-none
                                 focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium
                                      text-gray-700 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({
                        ...contactForm, email: e.target.value,
                      })}
                      placeholder="you@example.com"
                      className="w-full px-4 py-2.5 border border-gray-300
                                 rounded-lg text-sm focus:outline-none
                                 focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium
                                      text-gray-700 mb-1.5">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({
                        ...contactForm, message: e.target.value,
                      })}
                      placeholder="How can we help you?"
                      className="w-full px-4 py-2.5 border border-gray-300
                                 rounded-lg text-sm focus:outline-none
                                 focus:ring-2 focus:ring-blue-500 bg-white
                                 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={contactLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700
                               disabled:bg-blue-400 text-white font-semibold
                               py-3 rounded-xl transition-colors flex items-center
                               justify-center gap-2"
                  >
                    {contactLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white
                                        border-t-transparent rounded-full
                                        animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────── */}
      {!user && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700
                            rounded-3xl p-12 text-white shadow-2xl
                            shadow-blue-200 relative overflow-hidden">
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64
                                bg-white/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64
                                bg-white/5 rounded-full blur-3xl" />
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex
                                items-center justify-center mx-auto mb-6">
                  <GraduationCap size={32} className="text-white" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
                  Ready to Start Learning?
                </h2>
                <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
                  Join thousands of students already learning on LearnHub.
                  Create your free account today.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2
                               bg-white text-blue-700 font-bold px-8 py-4
                               rounded-xl hover:bg-blue-50 transition-colors
                               shadow-lg text-base"
                  >
                    Create Free Account
                    <ArrowRight size={18} />
                  </Link>
                  <Link
                    to="/courses"
                    className="inline-flex items-center justify-center gap-2
                               bg-white/10 backdrop-blur-sm border border-white/20
                               text-white font-semibold px-8 py-4 rounded-xl
                               hover:bg-white/20 transition-colors text-base"
                  >
                    <BookOpen size={18} />
                    Browse Courses
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center
                                justify-center">
                  <BookOpen size={18} className="text-white" />
                </div>
                <span className="text-xl font-bold">
                  Learn<span className="text-blue-400">Hub</span>
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                A production-grade Learning Management System connecting
                learners and instructors worldwide.
              </p>
              <div className="flex flex-col gap-2 mt-4">
                <a href="mailto:contact@learnhub.com"
                  className="flex items-center gap-2 text-gray-400
                             hover:text-white text-sm transition-colors">
                  <Mail size={14} />
                  contact@learnhub.com
                </a>
                <a href="tel:+15551234567"
                  className="flex items-center gap-2 text-gray-400
                             hover:text-white text-sm transition-colors">
                  <Phone size={14} />
                  +1 (555) 123-4567
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-2">
                {[
                  { label: 'Browse Courses', to: '/courses'  },
                  { label: 'Register',       to: '/register' },
                  { label: 'Login',          to: '/login'    },
                ].map((link) => (
                  <li key={link.label}>
                    <Link to={link.to}
                      className="text-gray-400 hover:text-white text-sm
                                 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                {[
                  { label: 'About Us', id: 'about'    },
                  { label: 'Services', id: 'services' },
                  { label: 'FAQ',      id: 'faq'      },
                  { label: 'Contact',  id: 'contact'  },
                ].map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() =>
                        document.getElementById(link.id)?.scrollIntoView({
                          behavior: 'smooth',
                        })
                      }
                      className="text-gray-400 hover:text-white text-sm
                                 transition-colors"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col
                          sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © 2026 LearnHub. Built with PERN Stack.
            </p>
            <p className="text-gray-500 text-sm">
              Made with ♥ for learners everywhere
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;
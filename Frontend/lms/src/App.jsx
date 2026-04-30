import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import RoleRoute from './components/RoleRoute';

// Public
import HomePage         from './pages/public/HomePage';
import LoginPage        from './pages/public/LoginPage';
import RegisterPage     from './pages/public/RegisterPage';
import CoursesPage      from './pages/public/CoursesPage';
import CourseDetailPage from './pages/public/CourseDetailPage';

// Student
import StudentDashboard from './pages/student/StudentDashboard';
import MyEnrollments    from './pages/student/MyEnrollments';
import MyPayments       from './pages/student/MyPayments';

// Instructor
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import MyCourses           from './pages/instructor/MyCourses';
import CreateCourse        from './pages/instructor/CreateCourse';
import EditCourse          from './pages/instructor/EditCourse';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers    from './pages/admin/ManageUsers';
import PendingCourses from './pages/admin/PendingCourses';
import ManagePayments from './pages/admin/ManagePayments';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>

            {/* PUBLIC */}
            <Route path="/"            element={<HomePage />} />
            <Route path="/login"       element={<LoginPage />} />
            <Route path="/register"    element={<RegisterPage />} />
            <Route path="/courses"     element={<CoursesPage />} />
            <Route path="/courses/:id" element={<CourseDetailPage />} />

            {/* STUDENT */}
            <Route path="/student/dashboard" element={
              <RoleRoute roles={['student']}><StudentDashboard /></RoleRoute>
            }/>
            <Route path="/student/enrollments" element={
              <RoleRoute roles={['student']}><MyEnrollments /></RoleRoute>
            }/>
            <Route path="/student/payments" element={
              <RoleRoute roles={['student']}><MyPayments /></RoleRoute>
            }/>

            {/* INSTRUCTOR */}
            <Route path="/instructor/dashboard" element={
              <RoleRoute roles={['instructor']}><InstructorDashboard /></RoleRoute>
            }/>
            <Route path="/instructor/courses" element={
              <RoleRoute roles={['instructor']}><MyCourses /></RoleRoute>
            }/>
            <Route path="/instructor/courses/create" element={
              <RoleRoute roles={['instructor']}><CreateCourse /></RoleRoute>
            }/>
            <Route path="/instructor/courses/edit/:id" element={
              <RoleRoute roles={['instructor']}><EditCourse /></RoleRoute>
            }/>

            {/* ADMIN */}
            <Route path="/admin/dashboard" element={
              <RoleRoute roles={['admin']}><AdminDashboard /></RoleRoute>
            }/>
            <Route path="/admin/users" element={
              <RoleRoute roles={['admin']}><ManageUsers /></RoleRoute>
            }/>
            <Route path="/admin/courses/pending" element={
              <RoleRoute roles={['admin']}><PendingCourses /></RoleRoute>
            }/>
            <Route path="/admin/payments" element={
              <RoleRoute roles={['admin']}><ManagePayments /></RoleRoute>
            }/>

            {/* FALLBACK */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
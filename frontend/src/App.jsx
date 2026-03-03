import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './store';
import { fetchMe } from './store/authSlice';
import { ToastProvider } from './components/Toast';
import Login from './pages/Login';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import SuperAdminDashboard from './pages/dashboards/SuperAdminDashboard';
import SchoolAdminDashboard from './pages/dashboards/SchoolAdminDashboard';
import BursarDashboard from './pages/dashboards/BursarDashboard';
import DeanDashboard from './pages/dashboards/DeanDashboard';
import TeacherDashboard from './pages/dashboards/TeacherDashboard';
import StudentDashboard from './pages/dashboards/StudentDashboard';
import Schools from './pages/Schools';
import Users from './pages/Users';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Courses from './pages/Courses';
import Attendance from './pages/Attendance';
import Marks from './pages/Marks';
import Discipline from './pages/Discipline';
import Homework from './pages/Homework';
import Exercises from './pages/Exercises';
import Notes from './pages/Notes';
import Fees from './pages/Fees';
import Announcements from './pages/Announcements';
import EmailComposer from './pages/EmailComposer';
import StudentChat from './pages/StudentChat';
import Reports from './pages/Reports';
import Timetable from './pages/Timetable';
import ActivityLogs from './pages/ActivityLogs';

function ProtectedRoute({ children, roles }) {
  const { user, token, loading } = useSelector((s) => s.auth);
  // not authenticated at all
  if (!token) return <Navigate to="/login" replace />;
  // still loading user info
  if (loading && !user) return <LoadingSpinner />;
  // user exists but role not allowed
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { token } = useSelector((s) => s.auth);

  useEffect(() => {
    if (token) dispatch(fetchMe()).catch(() => { });
  }, [token, dispatch]);

  // Login route - always render Login component (never blank)
  if (location.pathname === '/login') {
    if (token) return <Navigate to="/" replace />;
   return <Login />;
  }

  // All other routes require auth - redirect to login if no token
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated - show layout with nested content
  return (
    <Layout>
      <Routes>
        <Route index element={<DashboardRouter />} />
        <Route path="schools" element={<ProtectedRoute roles={['super_admin']}><Schools /></ProtectedRoute>} />
        <Route path="activity-logs" element={<ProtectedRoute roles={['super_admin']}><ActivityLogs /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute roles={['super_admin', 'school_admin']}><Users /></ProtectedRoute>} />
        <Route path="students" element={<ProtectedRoute roles={['super_admin', 'school_admin', 'dean', 'bursar', 'teacher', 'patron', 'matron']}><Students /></ProtectedRoute>} />
        <Route path="teachers" element={<ProtectedRoute roles={['super_admin', 'school_admin', 'dean']}><Teachers /></ProtectedRoute>} />
        <Route path="courses" element={<ProtectedRoute roles={['super_admin', 'school_admin', 'dean', 'teacher', 'student']}><Courses /></ProtectedRoute>} />
        <Route path="attendance" element={<ProtectedRoute roles={['super_admin', 'school_admin', 'dean', 'teacher', 'patron', 'matron']}><Attendance /></ProtectedRoute>} />
        <Route path="marks" element={<ProtectedRoute roles={['super_admin', 'school_admin', 'teacher', 'patron', 'matron', 'dean', 'student']}><Marks /></ProtectedRoute>} />
        <Route path="discipline" element={<ProtectedRoute roles={['super_admin', 'school_admin', 'dean', 'teacher', 'patron', 'matron']}><Discipline /></ProtectedRoute>} />
        <Route path="homework" element={<ProtectedRoute roles={['super_admin', 'school_admin', 'teacher', 'student']}><Homework /></ProtectedRoute>} />
        <Route path="exercises" element={<ProtectedRoute roles={['super_admin', 'school_admin', 'teacher', 'student']}><Exercises /></ProtectedRoute>} />
        <Route path="notes" element={<ProtectedRoute roles={['super_admin', 'school_admin', 'teacher', 'student']}><Notes /></ProtectedRoute>} />
        <Route path="fees" element={<ProtectedRoute roles={['super_admin', 'school_admin', 'bursar']}><Fees /></ProtectedRoute>} />
        <Route path="announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
        <Route path="email" element={
          <ProtectedRoute roles={['school_admin', 'patron', 'matron', 'dean']}>
            <EmailComposer />
          </ProtectedRoute>
        } />
        <Route path="timetable" element={
          <ProtectedRoute roles={['school_admin', 'teacher', 'student', 'dean', 'patron', 'matron']}>
            <Timetable />
          </ProtectedRoute>
        } />
        <Route path="chat" element={<ProtectedRoute roles={['student', 'patron', 'matron', 'dean', 'teacher', 'school_admin']}><StudentChat /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute roles={['student']}><Reports /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function DashboardRouter() {
  const { user, loading } = useSelector((s) => s.auth);
  if (loading && !user) return <LoadingSpinner />;
  if (!user) return <LoadingSpinner />;
  switch (user.role) {
    case 'super_admin': return <SuperAdminDashboard />;
    case 'school_admin': return <SchoolAdminDashboard />;
    case 'bursar': return <BursarDashboard />;
    case 'dean': return <DeanDashboard />;
    case 'teacher': return <TeacherDashboard />;
    case 'student': return <StudentDashboard />;
    default: return <SchoolAdminDashboard />;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="*" element={<AppRoutes />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Home from '../pages/public/Home';
import Register from '../pages/public/Register';
import OTPVerification from '../pages/public/OTPVerification';
import Login from '../pages/public/Login';
import ForgotPassword from '../pages/public/ForgotPassword';
import ResetPassword from '../pages/public/ResetPassword';
import PublicPetListing from '../pages/public/PetListing';
import PublicProductListing from '../pages/public/ProductListing';
import PublicDoctorList from '../pages/public/DoctorList';

const PublicRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  // Redirect authenticated users to their dashboard (role casing from API may vary)
  const getDashboardPath = () => {
    if (!isAuthenticated) return null;
    const role = String(user?.role || '').toLowerCase();
    if (role === 'customer') return '/customer/dashboard';
    if (role === 'doctor') return '/doctor/dashboard';
    if (role === 'admin' || role === 'staff') return '/admin/dashboard';
    return null;
  };

  const dashboardPath = getDashboardPath();

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated
            ? dashboardPath
              ? <Navigate to={dashboardPath} replace />
              : <Navigate to="/login" replace />
            : <Home />
        }
      />
      <Route path="/pets" element={<PublicPetListing />} />
      <Route path="/products" element={<PublicProductListing />} />
      <Route path="/doctors" element={<PublicDoctorList />} />
      <Route
        path="/register"
        element={isAuthenticated && dashboardPath ? <Navigate to={dashboardPath} replace /> : <Register />}
      />
      <Route
        path="/otp-verification"
        element={<OTPVerification />}
      />
      <Route
        path="/login"
        element={isAuthenticated && dashboardPath ? <Navigate to={dashboardPath} replace /> : <Login />}
      />
      <Route
        path="/forgot-password"
        element={isAuthenticated && dashboardPath ? <Navigate to={dashboardPath} replace /> : <ForgotPassword />}
      />
      <Route
        path="/reset-password"
        element={isAuthenticated && dashboardPath ? <Navigate to={dashboardPath} replace /> : <ResetPassword />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default PublicRoutes;


import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from './Loading';

const RequireAuth = ({ children, roles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    // Redirect to login with return path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role if specified (case-insensitive: backend may return 'Doctor' or 'doctor')
  const userRole = String(user?.role || '').trim().toLowerCase();
  const allowedRoles = roles.map((r) => String(r || '').trim().toLowerCase());
  if (roles.length > 0 && (!userRole || !allowedRoles.includes(userRole))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return children;
};

export default RequireAuth;


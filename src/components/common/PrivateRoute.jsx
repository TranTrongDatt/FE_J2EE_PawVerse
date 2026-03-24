import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

export default function PrivateRoute({ children, requiredRole, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Support array of allowed roles
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  // Support single required role (backwards compatible)
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}

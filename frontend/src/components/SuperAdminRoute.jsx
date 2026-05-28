import { Navigate } from 'react-router-dom';

export default function SuperAdminRoute({ children }) {
  const token = localStorage.getItem('zoniics_sa_token');
  if (!token) return <Navigate to="/superadmin/login" replace />;
  return children;
}

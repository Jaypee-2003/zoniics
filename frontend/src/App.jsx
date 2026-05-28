import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout   from './components/DashboardLayout';
import ProtectedRoute    from './components/ProtectedRoute';
import LandingPage       from './pages/LandingPage';
import OverviewPage      from './pages/OverviewPage';
import ConfigPage        from './pages/ConfigPage';
import LogsPage          from './pages/LogsPage';
import CampaignPage      from './pages/CampaignPage';
import CampaignDashboard from './pages/CampaignDashboard';
import LoginPage         from './pages/LoginPage';
import RegisterPage      from './pages/RegisterPage';

function RedirectIfAuthed({ children }) {
  const token = localStorage.getItem('zoniics_token');
  return token ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public marketing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Public auth routes */}
        <Route path="/login"    element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>} />
        <Route path="/register" element={<RedirectIfAuthed><RegisterPage /></RedirectIfAuthed>} />

        {/* Protected dashboard routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index                element={<OverviewPage />} />
          <Route path="config"        element={<ConfigPage />} />
          <Route path="logs"          element={<LogsPage />} />
          <Route path="campaigns"     element={<CampaignPage />} />
          <Route path="campaigns/:id" element={<CampaignDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout      from './components/DashboardLayout';
import ProtectedRoute       from './components/ProtectedRoute';
import SuperAdminLayout     from './components/SuperAdminLayout';
import SuperAdminRoute      from './components/SuperAdminRoute';
import LandingPage          from './pages/LandingPage';
import OverviewPage         from './pages/OverviewPage';
import ConfigPage           from './pages/ConfigPage';
import LogsPage             from './pages/LogsPage';
import OutreachPage         from './pages/CampaignPage';
import CampaignDashboard    from './pages/CampaignDashboard';
import LoginPage            from './pages/LoginPage';
import RegisterPage         from './pages/RegisterPage';
import ContactsPage         from './pages/ContactsPage';
import AnalyticsPage        from './pages/AnalyticsPage';
import WhatsAppPage         from './pages/WhatsAppPage';
import VoicePage            from './pages/VoicePage';
import AutomationPage       from './pages/AutomationPage';
import BillingPage          from './pages/BillingPage';
import TeamPage             from './pages/TeamPage';
import OnboardingPage       from './pages/OnboardingPage';
import SuperAdminLoginPage  from './pages/SuperAdminLoginPage';
import SAOverview           from './pages/superadmin/SAOverview';
import SABusinesses         from './pages/superadmin/SABusinesses';
import SAPlans              from './pages/superadmin/SAPlans';
import SAAIManagement       from './pages/superadmin/SAAIManagement';
import SASecurity           from './pages/superadmin/SASecurity';
import SAAnalytics          from './pages/superadmin/SAAnalytics';
import SASettings           from './pages/superadmin/SASettings';

function RedirectIfAuthed({ children }) {
  const token = localStorage.getItem('zoniics_token');
  return token ? <Navigate to="/dashboard" replace /> : children;
}

function RedirectIfSAAuthed({ children }) {
  const token = localStorage.getItem('zoniics_sa_token');
  return token ? <Navigate to="/superadmin" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login"    element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>} />
        <Route path="/register" element={<RedirectIfAuthed><RegisterPage /></RedirectIfAuthed>} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

        {/* Business dashboard */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index                    element={<OverviewPage />} />
          <Route path="analytics"         element={<AnalyticsPage />} />
          <Route path="voice"             element={<VoicePage />} />
          <Route path="whatsapp"          element={<WhatsAppPage />} />
          <Route path="contacts"          element={<ContactsPage />} />
          <Route path="campaigns"         element={<OutreachPage />} />
          <Route path="campaigns/:id"     element={<CampaignDashboard />} />
          <Route path="automation"        element={<AutomationPage />} />
          <Route path="config"            element={<ConfigPage />} />
          <Route path="logs"              element={<LogsPage />} />
          <Route path="billing"           element={<BillingPage />} />
          <Route path="team"              element={<TeamPage />} />
        </Route>

        {/* Super Admin */}
        <Route path="/superadmin/login" element={<RedirectIfSAAuthed><SuperAdminLoginPage /></RedirectIfSAAuthed>} />
        <Route path="/superadmin" element={<SuperAdminRoute><SuperAdminLayout /></SuperAdminRoute>}>
          <Route index                  element={<SAOverview />} />
          <Route path="businesses"      element={<SABusinesses />} />
          <Route path="plans"           element={<SAPlans />} />
          <Route path="ai"              element={<SAAIManagement />} />
          <Route path="security"        element={<SASecurity />} />
          <Route path="analytics"       element={<SAAnalytics />} />
          <Route path="settings"        element={<SASettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

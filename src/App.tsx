import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider';
import { useAuth } from './contexts/AuthContext';
import { QueryProvider } from './contexts/QueryProvider';
import { Layout } from './components/layout/Layout';
import { ScoreProvider } from './contexts/ScoreProvider';
import { useScoreContext } from './contexts/ScoreContext';
import { StoreSync } from './stores/StoreSync';
import { TooltipProvider } from './components/ui/atoms/Tooltip';
import { GlobalLoader } from './components/ui/molecules/GlobalLoader';
import { Toast } from './components/ui/molecules/Toast';
import { ThemeController } from './components/logic/ThemeController';
import { useUIStore } from './stores/uiStore';
import { initTheme } from './utils/themeManager';

// Pages
import Dashboard from './pages/dashboard/DashboardPage';
import { ProtocolsList } from './pages/protocols';
import InnerfacesPage from './pages/innerfaces/InnerfacesPage';
import HistoryPage from './pages/history/HistoryPage';
import JoinInvitePage from './pages/JoinInvitePage';
import LoginPage from './pages/LoginPage';
import { SettingsPage } from './pages/settings/SettingsPage';



function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AppContent() {
  const { initialized } = useScoreContext();
  const { user, loading: authLoading } = useAuth();
  const { toast, hideToast } = useUIStore();

  // Logic: 
  // 1. Auth Loading -> Show Loader
  // 2. No User -> Show Login (App handles routing)
  // 3. User & !Initialized -> Show GlobalLoader
  // 4. Always render StoreSync to ensure data fetching starts if user exists.
  // Invite route needs to handle its own loading states
  // So we check the current path and bypass GlobalLoader for invite routes
  const isInviteRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/invite/');

  if (authLoading && !isInviteRoute) return <GlobalLoader />;

  return (
    <TooltipProvider delayDuration={300}>
      <Router>
        <StoreSync />
        <ThemeController />
        <Toast
          message={toast.message}
          isVisible={toast.isVisible}
          type={toast.type}
          onClose={hideToast}
          actionLabel={toast.actionLabel}
          onAction={toast.onAction}
        />
        <Routes>
          {/* Public routes - always accessible */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/invite/:code" element={<JoinInvitePage />} />

          {/* Private routes - require initialization */}
          <Route path="/" element={
            (!initialized && user) ? <GlobalLoader /> : (
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            )
          } />
          <Route path="/actions" element={
            (!initialized && user) ? <GlobalLoader /> : (
              <PrivateRoute>
                <Layout>
                  <ProtocolsList />
                </Layout>
              </PrivateRoute>
            )
          } />
          <Route path="/powers" element={
            (!initialized && user) ? <GlobalLoader /> : (
              <PrivateRoute>
                <Layout>
                  <InnerfacesPage />
                </Layout>
              </PrivateRoute>
            )
          } />
          <Route path="/history" element={
            (!initialized && user) ? <GlobalLoader /> : (
              <PrivateRoute>
                <Layout>
                  <HistoryPage />
                </Layout>
              </PrivateRoute>
            )
          } />
          <Route path="/settings" element={
            (!initialized && user) ? <GlobalLoader /> : (
              <PrivateRoute>
                <Layout>
                  <SettingsPage />
                </Layout>
              </PrivateRoute>
            )
          } />
          {/* Add more routes here */}
        </Routes>
      </Router>
    </TooltipProvider>
  );
}

function App() {
  useEffect(() => {
    // Initialize theme from localStorage (or default to serika_dark)
    initTheme();
  }, []);



  return (
    <QueryProvider>
      <AuthProvider>
        <ScoreProvider>
          <AppContent />
        </ScoreProvider>
      </AuthProvider>
    </QueryProvider>
  );
}

export default App;

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthProvider';
import { QueryProvider } from './contexts/QueryProvider';
import { Layout } from './components/layout/Layout';
import { ScoreProvider, useScoreContext } from './contexts/ScoreProvider';
import { StoreSync } from './stores/StoreSync';
import { TooltipProvider } from './components/ui/atoms/Tooltip';
import { GlobalLoader } from './components/ui/molecules/GlobalLoader';
import { applyTheme } from './utils/themeManager';
import { themes } from './styles/themes';

// Pages
import Dashboard from './pages/dashboard/DashboardPage';
import { ProtocolsList } from './pages/protocols';
import InnerfacesPage from './pages/innerfaces/InnerfacesPage';
import HistoryPage from './pages/history/HistoryPage';
import JoinInvitePage from './pages/JoinInvitePage';
import LoginPage from './pages/LoginPage';



function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AppContent() {
  const { initialized } = useScoreContext();
  const { user, loading: authLoading } = useAuth();

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
          <Route path="/protocols" element={
            (!initialized && user) ? <GlobalLoader /> : (
              <PrivateRoute>
                <Layout>
                  <ProtocolsList />
                </Layout>
              </PrivateRoute>
            )
          } />
          <Route path="/innerfaces" element={
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
          {/* Add more routes here */}
        </Routes>
      </Router>
    </TooltipProvider>
  );
}

function App() {
  useEffect(() => {
    // Initialize default theme (matches MonkeyType serika_dark)
    applyTheme(themes.serika_dark);
  }, []);

  useEffect(() => {
    // Log performance metrics on mount
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const navStart = (window as any).__navStart;
    if (navStart) {
      console.log(`[PERF][2] App: Rendering shell at ${performance.now().toFixed(2)}ms (Delta: ${(performance.now() - navStart).toFixed(2)}ms)`);
    }
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

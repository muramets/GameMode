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

const Login = () => {
  const { signInWithGoogle, user } = useAuth();

  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary text-text-primary">
      <div className="p-8 bg-card-bg rounded-lg shadow-lg text-center max-w-md w-full border border-border">
        <h1 className="text-3xl font-bold mb-2">GameMode</h1>
        <p className="text-text-secondary mb-8">Level up your life</p>
        <button
          onClick={signInWithGoogle}
          className="w-full bg-button-secondary-bg hover:bg-button-secondary-hover text-button-secondary-text font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

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

  if (authLoading) return <GlobalLoader />;

  return (
    <TooltipProvider delayDuration={300}>
      <StoreSync />
      {(!initialized && user) ? (
        <GlobalLoader />
      ) : (
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/invite/:code" element={<JoinInvitePage />} />
            <Route path="/" element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/protocols" element={
              <PrivateRoute>
                <Layout>
                  <ProtocolsList />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/innerfaces" element={
              <PrivateRoute>
                <Layout>
                  <InnerfacesPage />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/history" element={
              <PrivateRoute>
                <Layout>
                  <HistoryPage />
                </Layout>
              </PrivateRoute>
            } />
            {/* Add more routes here */}
          </Routes>
        </Router>
      )}
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

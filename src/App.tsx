import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthProvider';
import { QueryProvider } from './contexts/QueryProvider';
import { Layout } from './components/layout/Layout';
import { ScoreProvider } from './contexts/ScoreProvider';
import { StoreSync } from './stores/StoreSync';

// Pages
import Dashboard from './pages/dashboard/DashboardPage';
import { ProtocolsList } from './pages/protocols';
import InnerfacesPage from './pages/innerfaces/InnerfacesPage';
import HistoryPage from './pages/history/HistoryPage';

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
  console.log("PrivateRoute check:", { user: user?.email, loading });
  if (loading) return <div>Loading...</div>;
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <ScoreProvider>
          <StoreSync />
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
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
        </ScoreProvider>
      </AuthProvider>
    </QueryProvider>
  );
}

export default App;

import React from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import PWAInstallPrompt from './components/PWAInstallPrompt.jsx'; // Import the component

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {user ? <Dashboard /> : <Auth />}
      <PWAInstallPrompt /> {/* Add it here */}
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
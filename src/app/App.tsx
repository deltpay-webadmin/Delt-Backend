import React from 'react';
import { DeltBackendLayout } from './components/backend/DeltBackendLayout';
import { Login } from './components/Login';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { Toaster } from 'sonner@2.0.3';

function Gate() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'signedOut') return <Login />;

  return <DeltBackendLayout />;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <Gate />
    </AuthProvider>
  );
}

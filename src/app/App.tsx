import React from 'react';
import { DeltBackendLayout } from './components/backend/DeltBackendLayout';
import { Toaster } from 'sonner@2.0.3';

export default function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <DeltBackendLayout />
    </>
  );
}

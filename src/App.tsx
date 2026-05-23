import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { VinylPage } from './pages/vinyl';
import { AudioProvider } from './context/audio-context';
import { AuthProvider, useAuth } from './context/auth-context';
import { SavedProvider } from './context/saved-context';
import { SavedVinylsProvider } from './context/saved-vinyls-context';
import { MyProvider } from './context';
import { PlayerScene } from './pages/player';
import { UploadTrackPage } from './pages/upload/track';
import { CreateVinylPage } from './pages/upload/vinyl';
import { AuthPage } from './pages/auth';
import { LibraryPage } from './pages/library';
import { TracksPage } from './pages/library/tracks';
import { SavedPage } from './pages/library/saved';
import { SearchPage } from './pages/library/search';
import { VinylsPage } from './pages/library/vinyls';
import { ProfilePage } from './pages/profile';
import { UserProfilePage } from './pages/profile/user-profile';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { token } = useAuth();
    return token ? <>{children}</> : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <AudioProvider>
        <SavedProvider>
        <SavedVinylsProvider>
        <MyProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<AuthPage />} />
              <Route path="/" element={<ProtectedRoute><PlayerScene /></ProtectedRoute>} />
              <Route path="/vinyl" element={<ProtectedRoute><VinylPage /></ProtectedRoute>} />
              <Route path="/upload/track" element={<ProtectedRoute><UploadTrackPage /></ProtectedRoute>} />
              <Route path="/upload/vinyl" element={<ProtectedRoute><CreateVinylPage /></ProtectedRoute>} />
              <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
              <Route path="/tracks" element={<ProtectedRoute><TracksPage /></ProtectedRoute>} />
              <Route path="/saved" element={<ProtectedRoute><SavedPage /></ProtectedRoute>} />
              <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
              <Route path="/vinyls" element={<ProtectedRoute><VinylsPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/users/:id" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
            </Routes>
          </BrowserRouter>
        </MyProvider>
        </SavedVinylsProvider>
        </SavedProvider>
      </AudioProvider>
    </AuthProvider>
  );
}

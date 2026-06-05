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
import { UploadPostPage } from './pages/upload/post';
import { AuthPage } from './pages/auth';
import { LibraryPage } from './pages/library';
import { TracksPage } from './pages/library/tracks';
import { SavedPage } from './pages/library/saved';
import { SearchPage } from './pages/library/search';
import { VinylsPage } from './pages/library/vinyls';
import { ProfilePage } from './pages/profile';
import { UserProfilePage } from './pages/profile/user-profile';
import { AdminPage } from './pages/admin';

// games
import { Crocodile } from './pages/games';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { token } = useAuth();
    return token ? <>{children}</> : <Navigate to="/pages/login" replace />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { token, user } = useAuth();
    if (!token) return <Navigate to="/pages/login" replace />;
    if (user && user.is_admin !== 1) return <Navigate to="/" replace />;
    return <>{children}</>;
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
              <Route path="/pages/login" element={<AuthPage />} />
              <Route path="/" element={<ProtectedRoute><PlayerScene /></ProtectedRoute>} />
              <Route path="/pages/vinyl" element={<ProtectedRoute><VinylPage /></ProtectedRoute>} />
              <Route path="/pages/upload/track" element={<ProtectedRoute><UploadTrackPage /></ProtectedRoute>} />
              <Route path="/pages/upload/vinyl" element={<ProtectedRoute><CreateVinylPage /></ProtectedRoute>} />
              <Route path="/pages/upload/post" element={<ProtectedRoute><UploadPostPage /></ProtectedRoute>} />
              <Route path="/pages/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
              <Route path="/pages/tracks" element={<ProtectedRoute><TracksPage /></ProtectedRoute>} />
              <Route path="/pages/saved" element={<ProtectedRoute><SavedPage /></ProtectedRoute>} />
              <Route path="/pages/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
              <Route path="/pages/vinyls" element={<ProtectedRoute><VinylsPage /></ProtectedRoute>} />
              <Route path="/pages/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/pages/users/:id" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
              <Route path="/pages/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

              {/* games */}
              <Route path='/games/crocodile' element={<Crocodile />} />
            </Routes>
          </BrowserRouter>
        </MyProvider>
        </SavedVinylsProvider>
        </SavedProvider>
      </AudioProvider>
    </AuthProvider>
  );
}

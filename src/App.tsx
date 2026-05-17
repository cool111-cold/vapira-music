import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import VinylTransport from './VinylTransport';
import { VinylPage } from './pages/vinyl';
import { AudioProvider } from './context/audio-context';
import { AuthProvider, useAuth } from './context/auth-context';
import { MyProvider } from './context';
import { PlayerTwo } from './components/player/player-two';
import { UploadPage } from './pages/upload';
import { AuthPage } from './pages/auth';
import { LibraryPage } from './pages/library';
import { TracksPage } from './pages/library/tracks';
import { SavedPage } from './pages/library/saved';
import { SearchPage } from './pages/library/search';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { token } = useAuth();
    return token ? <>{children}</> : <Navigate to="/login" replace />;
};

function PlayerScene() {
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#222222', display: 'flex' }}>
      <PlayerTwo top />
      <Canvas
        shadows
        camera={{ zoom: 3, position: [0, 10, 0], up: [0, 0, -1], fov: 45 }}
        gl={{
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <Environment preset='park' />
        <ambientLight intensity={8} />
        <directionalLight
          position={[3, 6, -4]}
          intensity={2.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={0.1}
          shadow-camera-far={30}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
        />
        <VinylTransport
          position={[0, 0, 0]}
          scale={5}
          click={() => console.log('clicked')}
          centerImageUrl="https://static.insales-cdn.com/r/itZPHiUfev0/rs:fit:296:0:1/q:80/plain/images/products/1/14/242049038/large_tyler-the-creator-igor-cd2.jpg@jpg"
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <shadowMaterial opacity={0.2} />
        </mesh>
        <OrbitControls makeDefault enableRotate={false} enablePan={false} />
      </Canvas>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AudioProvider>
        <MyProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<AuthPage />} />
              <Route path="/" element={<ProtectedRoute><PlayerScene /></ProtectedRoute>} />
              <Route path="/vinyl" element={<ProtectedRoute><VinylPage /></ProtectedRoute>} />
              <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
              <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
              <Route path="/tracks" element={<ProtectedRoute><TracksPage /></ProtectedRoute>} />
              <Route path="/saved" element={<ProtectedRoute><SavedPage /></ProtectedRoute>} />
              <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
            </Routes>
          </BrowserRouter>
        </MyProvider>
      </AudioProvider>
    </AuthProvider>
  );
}

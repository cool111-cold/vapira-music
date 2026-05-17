import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import VinylTransport from './VinylTransport';
import { VinylPage } from './pages/vinyl';
import { AudioProvider } from './context/audio-context';
import { MyProvider } from './context';
import { PlayerTwo } from './components/player/player-two';
import { UploadPage } from './pages/upload';

function PlayerScene() {
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#b7b7b7', display: 'flex' }}>
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
      <Link
        to="/vinyl"
        style={{
          position: 'absolute',
          bottom: 24,
          left: 24,
          padding: '8px 16px',
          backgroundColor: '#431d1db3',
          color: '#fff',
          borderRadius: 8,
          textDecoration: 'none',
          border: '1px solid #513f3fb3',
        }}
      >
        Vinyl
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <AudioProvider>
      <MyProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PlayerScene />} />
            <Route path="/vinyl" element={<VinylPage />} />
            <Route path="/upload" element={<UploadPage />} />
          </Routes>
        </BrowserRouter>
      </MyProvider>
    </AudioProvider>
  );
}

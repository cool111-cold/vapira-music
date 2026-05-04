import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import Model from './Model';
import Record from './Record';
import { VinylPage } from './pages/vinyl';
// '#b7b7b7'
// #421111

function PlayerScene() {
  const [turntablePos, setTurntablePos] = useState<THREE.Vector3 | null>(null);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#b7b7b7', display: 'flex' }}>
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
        <Model onTurntableReady={setTurntablePos} />
        {turntablePos && (
          <Record position={new THREE.Vector3(turntablePos.x, turntablePos.y + 0.06, turntablePos.z)} />
        )}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <shadowMaterial opacity={0.2} />
        </mesh>
        <OrbitControls makeDefault enableRotate={false} enablePan={false} />
      </Canvas>
        {/*
        #431d1db3
        #513f3fb3

        '#98989857'
        #ffffff57
         */}
      {/* <div style={{width: 400, height: 500, backgroundColor: '#431d1db3', borderTop: '1px solid #513f3fb3', borderBottom: '1px solid #513f3fb3', borderLeft: '2px solid #513f3fb3', borderRight: '2px solid #513f3fb3', borderRadius: 30, position: 'absolute', right: 120, top: 120}}>

      </div> */}
      <Link
        to="/vinyl"
        style={{
          position: 'absolute',
          top: 24,
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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PlayerScene />} />
        <Route path="/vinyl" element={<VinylPage />} />
      </Routes>
    </BrowserRouter>
  );
}

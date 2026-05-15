import { useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface VinylTransportProps {
  position?: THREE.Vector3 | number[];
  scale?: number | number[];
  centerImageUrl?: string;
  click?: () => void;
}

const LABEL_RADIUS = 0.06;

export default function VinylTransport({ position = [0, 0, 0], scale = 1, centerImageUrl, click }: VinylTransportProps) {
  const { scene } = useGLTF('/vinyl_transport.glb');
  const discRef = useRef<THREE.Object3D | null>(null);
  const labelMeshRef = useRef<THREE.Mesh | null>(null);
  const isPlaying = useRef(false);

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
      if (child.name === 'DiscPlate_low') {
        discRef.current = child;

        if (!labelMeshRef.current) {
          const geo = new THREE.CircleGeometry(LABEL_RADIUS, 64);
          const mat = new THREE.MeshBasicMaterial({ transparent: true });  
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.z = 0.002;
          mesh.name = 'CenterLabel';
          child.add(mesh);
          labelMeshRef.current = mesh;
        }
      }
    });

    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          const mat = m as THREE.MeshStandardMaterial;
          if (mat.isMeshStandardMaterial) {
            mat.envMapIntensity = 5;
          }
        });
      }
    });
  }, [scene]);

  useEffect(() => {
    const label = labelMeshRef.current;
    if (!label) return;
    const mat = label.material as THREE.MeshBasicMaterial;

    if (!centerImageUrl) {
      mat.map = null;
      mat.needsUpdate = true;
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    loader.load(centerImageUrl, (texture) => {
      mat.map = texture;
      mat.needsUpdate = true;
    });
  }, [centerImageUrl]);

  useFrame((_, delta) => {
    if (isPlaying.current && discRef.current) {
      discRef.current.rotation.z += delta * 2;
    }
  });

  return (
    <primitive
      object={scene}
      position={position}
      scale={scale}
      rotation={[0, -Math.PI / 2, 0]}
      onClick={(e: any) => {
        e.stopPropagation();
        if (e.object.name === 'Needle_low_low_TurnTable_Detail_MAT_0') {
          isPlaying.current = !isPlaying.current;
          click?.();
        }
      }}
      onPointerOver={(e: any) => {
        e.stopPropagation();
        console.log('mesh:', e.object.name, '| parent:', e.object.parent?.name);
      }}
    />
  );
}

useGLTF.preload('/vinyl_transport.glb');

import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { playerState } from './playerState';

interface RecordProps {
  position: THREE.Vector3 | number[];
  scale?: number;
  centerImageUrl?: string;
  click?: () => void;
}

function RecordWithTexture({
  clonedScene,
  centerImageUrl,
}: {
  clonedScene: THREE.Object3D;
  centerImageUrl: string;
}) {
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    loader.load(centerImageUrl, (texture) => {
      clonedScene.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh) {
          if (mesh.name === 'Inner_PBR1_0') {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              const newMat = mat.clone();
              newMat.map = texture;
              newMat.color.set(0xffffff);
              mesh.material = newMat;
          }
        }
      });
    });
  }, [clonedScene, centerImageUrl]);

  return null;
}

export default function Record({ position, scale = 0.02, centerImageUrl, click}: RecordProps) {
  const { scene } = useGLTF('/record.glb');
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [clonedScene]);

  useFrame((_, delta) => {
    if (playerState.isPlaying) {
      clonedScene.rotation.y += delta * 1.5;
    }
  });

  return (
    <>
      <primitive
        object={clonedScene}
        position={position}
        scale={scale}
        onClick={click}
        // onPointerOver={(e: any) => {
        //   e.stopPropagation();
        //   const mesh = e.object as THREE.Mesh;
        //   const mat = mesh.material as THREE.MeshStandardMaterial;
        //   console.log('mesh name:', mesh.name, '| color:', mat?.color);
        // }}
      />
      {centerImageUrl && (
        <RecordWithTexture clonedScene={clonedScene} centerImageUrl={centerImageUrl} />
      )}
    </>
  );
}


// import { useEffect, useMemo, useRef } from 'react';
// import { useGLTF } from '@react-three/drei';
// import { useFrame } from '@react-three/fiber';
// import * as THREE from 'three';
// import { playerState } from './playerState';

// // Adjust if label circle appears wrong size or offset
// const LABEL_RADIUS = 15;
// const LABEL_OFFSET_Z = 0.5;

// interface RecordProps {
//   position: THREE.Vector3 | number[];
//   scale?: number;
//   centerImageUrl?: string;
//   click?: () => void;
// }

// export default function Record({ position, scale = 0.02, centerImageUrl, click }: RecordProps) {
//   const { scene } = useGLTF('/record.glb');
//   const clonedScene = useMemo(() => scene.clone(true), [scene]);
//   const labelMeshRef = useRef<THREE.Mesh | null>(null);

//   useEffect(() => {
//     clonedScene.traverse((child) => {
//       if ((child as THREE.Mesh).isMesh) {
//         child.castShadow = true;
//         child.receiveShadow = true;
//       }
//       if (child.name === 'Inner_PBR1_0' && !labelMeshRef.current) {
//         const geo = new THREE.CircleGeometry(LABEL_RADIUS, 64);
//         const mat = new THREE.MeshBasicMaterial({ transparent: true });
//         const mesh = new THREE.Mesh(geo, mat);
//         mesh.position.z = LABEL_OFFSET_Z;
//         mesh.name = 'CenterLabel';
//         child.add(mesh);
//         labelMeshRef.current = mesh;
//       }
//     });
//   }, [clonedScene]);

//   useEffect(() => {
//     const label = labelMeshRef.current;
//     if (!label) return;
//     const mat = label.material as THREE.MeshBasicMaterial;

//     if (!centerImageUrl) {
//       mat.map = null;
//       mat.needsUpdate = true;
//       return;
//     }

//     const loader = new THREE.TextureLoader();
//     loader.crossOrigin = 'anonymous';
//     loader.load(centerImageUrl, (texture) => {
//       texture.colorSpace = THREE.SRGBColorSpace;
//       mat.map = texture;
//       mat.needsUpdate = true;
//     });
//   }, [centerImageUrl]);

//   useFrame((_, delta) => {
//     if (playerState.isPlaying) {
//       clonedScene.rotation.y += delta * 1.5;
//     }
//   });

//   return (
//     <primitive
//       object={clonedScene}
//       position={position}
//       scale={scale}
//       onClick={click}
//     />
//   );
// }

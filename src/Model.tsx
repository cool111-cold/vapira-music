import { useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { playerState } from './playerState';

const SLIDER_RANGE = 0.3;
const NEEDLE_SWING = 0.5;

interface ModelProps {
  onTurntableReady?: (pos: THREE.Vector3) => void;
}

export default function Model({ onTurntableReady }: ModelProps) {
  const { scene, nodes } = useGLTF('/vinyl_player.glb');

  const sliderInitX = useRef<number>(0);
  const pivotGroup = useRef<THREE.Group | null>(null);
  const pivotInitY = useRef<number>(0);

  const sliderOffset = useRef<number>(0);
  const needleGoal = useRef<'home' | 'slider'>('home');
  const needleFixedRot = useRef<number>(0); // угол зафиксированный в момент клика

  const isDragging = useRef(false);
  const dragStartClientY = useRef(0);
  const dragStartOffset = useRef(0);

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const slider = nodes['pCube6'];
    if (slider) sliderInitX.current = slider.position.x;

    // Логируем позицию турнтабла и передаём наверх
    const turntable = nodes['pCylinder2'];
    if (turntable) {
      const wp = new THREE.Vector3();
      turntable.getWorldPosition(wp);
      console.log('Turntable world pos:', wp);
      onTurntableReady?.(wp);
    }

    // Создаём группу-пивот в позиции pCylinder16 (основание тонарма)
    const c16 = nodes['pCylinder16'];
    const c23 = nodes['pCylinder23'];
    const c30 = nodes['pCylinder30'];
    const rootNode = c16?.parent;

    if (c16 && c23 && c30 && rootNode && !pivotGroup.current) {
      const pivot = new THREE.Group();
      pivot.name = 'needlePivot';
      // Позиция пивота = центр основания (pCylinder16)
      pivot.position.copy(c16.position);
      rootNode.add(pivot);

      // Перекладываем все три объекта в группу, смещая позицию относительно пивота
      for (const node of [c16, c23, c30]) {
        node.position.sub(pivot.position);
        pivot.add(node);
      }

      pivotGroup.current = pivot;
      pivotInitY.current = pivot.rotation.y;
    }
  }, [scene, nodes]);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current) return;
      const deltaY = e.clientY - dragStartClientY.current;
      const delta = deltaY / (window.innerHeight * 0.3);
      sliderOffset.current = THREE.MathUtils.clamp(
        dragStartOffset.current + delta,
        -0.8,
        0.6
      );
    }
    function onMouseUp() {
      isDragging.current = false;
      document.body.style.cursor = '';
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  useFrame(() => {
    const slider = nodes['pCube6'];
    const pivot = pivotGroup.current;
    if (!slider || !pivot) return;

    const targetX = sliderInitX.current + sliderOffset.current * SLIDER_RANGE;
    slider.position.x = THREE.MathUtils.lerp(slider.position.x, targetX, 0.15);

    const targetRot =
      needleGoal.current === 'slider'
        ? needleFixedRot.current
        : pivotInitY.current;

    pivot.rotation.y = THREE.MathUtils.lerp(pivot.rotation.y, targetRot, 0.06);
  });

  function onPointerDown(e: ThreeEvent<PointerEvent>) {
    if (e.object.parent?.name !== 'pCube6') return;
    e.stopPropagation();
    isDragging.current = true;
    dragStartClientY.current = e.nativeEvent.clientY;
    dragStartOffset.current = sliderOffset.current;
    document.body.style.cursor = 'grabbing';
  }

  function onClick(e: ThreeEvent<MouseEvent>) {
    const parent = e.object.parent?.name;
    if (parent !== 'pCylinder16' && parent !== 'pCylinder23' && parent !== 'pCylinder30') return;
    e.stopPropagation();
    if (needleGoal.current === 'home') {
      needleFixedRot.current = pivotInitY.current - 1 * NEEDLE_SWING;
      needleGoal.current = 'slider';
      playerState.isPlaying = true;
    } else {
      needleGoal.current = 'home';
      playerState.isPlaying = false;
    }
  }

  return (
    <primitive
      object={scene}
      rotation={[0, -Math.PI / 2, 0]}
      onPointerDown={onPointerDown}
      onClick={onClick}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        console.log('parent:', e.object.parent?.name, '| mesh:', e.object.name);
      }}
    />
  );
}

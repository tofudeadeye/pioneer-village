import { createRef, useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

import { emitClient } from '@lib/ui';
import threejsStore from '../../stores/threejs-store';
import { useEscapeKey } from '../../hooks/use-game-events';

export default function ThreeJS() {
  const [state, setState] = useState(threejsStore.getState());
  const refWrapper = createRef<HTMLDivElement>();
  const camera = useRef<THREE.PerspectiveCamera | null>(null);
  const scene = useRef<THREE.Scene | null>(null);
  const renderer = useRef<THREE.WebGLRenderer | null>(null);
  const cube = useRef<THREE.Mesh | null>(null);
  const sprite = useRef<THREE.Sprite | null>(null);
  const lastTime = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = threejsStore.subscribe(setState);
    return unsubscribe;
  }, []);

  // Handle escape key
  const onEscape = useCallback(() => {
    threejsStore.close();
  }, []);

  useEscapeKey(state.show, onEscape);

  useEffect(() => {
    camera.current = new THREE.PerspectiveCamera(state.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
    scene.current = new THREE.Scene();

    const geometry = new THREE.BoxGeometry(0.25, 0.5, 0.25);
    const material = new THREE.MeshNormalMaterial();
    cube.current = new THREE.Mesh(geometry, material);
    scene.current.add(cube.current);

    const map = new THREE.TextureLoader().load('https://p--v.b-cdn.net/smear-1.png');
    const material2 = new THREE.SpriteMaterial({ map });
    sprite.current = new THREE.Sprite(material2);
    sprite.current.scale.set(0.75, 0.18, 1);
    scene.current.add(sprite.current);

    renderer.current = new THREE.WebGLRenderer({ alpha: true });
    renderer.current.setSize(window.innerWidth, window.innerHeight);
    renderer.current.setAnimationLoop(handleAnimate);

    refWrapper?.current?.appendChild(renderer.current.domElement);

    return () => {
      if (renderer.current && refWrapper?.current) {
        refWrapper.current.removeChild(renderer.current.domElement);
      }
    };
  }, []);

  useEffect(() => {
    // Store handles all events
    // THREE.js state updates are handled by the store
  }, []);

  useEffect(() => {
    if (!camera.current || !cube.current || !sprite.current) return;

    camera.current.fov = state.fov;
    camera.current.updateProjectionMatrix();

    camera.current.position.set(state.cameraPosition.x, state.cameraPosition.y, state.cameraPosition.z);
    camera.current.rotation.set(state.cameraRotation.x, state.cameraRotation.y, state.cameraRotation.z);

    cube.current.position.set(state.targetPosition.x, state.targetPosition.y, state.targetPosition.z);
    cube.current.rotation.set(state.targetRotation.x, state.targetRotation.y, state.targetRotation.z);
    sprite.current.position.set(state.targetPosition.x, state.targetPosition.y, state.targetPosition.z);
  }, [state]);

  const handleAnimate = (time: number) => {
    // const delta = time - lastTime.current;
    // lastTime.current = time;

    if (renderer.current && scene.current && camera.current) {
      renderer.current.render(scene.current, camera.current);
    }
  };

  return (
    <>
      <div
        ref={refWrapper}
        style={{
          position: 'absolute',
          inset: 0,
          display: state.show ? 'block' : 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          display: state.show ? 'block' : 'none',
        }}
      >
        <h1>
          {state.cameraPosition.x.toFixed(2)}, {-state.cameraPosition.z.toFixed(2)},{' '}
          {state.cameraPosition.y.toFixed(2)}
        </h1>
        <h1>
          {state.cameraRotation.x.toFixed(2)}, {-state.cameraRotation.z.toFixed(2)},{' '}
          {state.cameraRotation.y.toFixed(2)}
        </h1>
      </div>
    </>
  );
}
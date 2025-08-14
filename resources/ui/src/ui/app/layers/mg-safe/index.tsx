import { Howl, Howler } from 'howler';
import { useState, useEffect, useRef } from 'react';

import styles from './styles.module.scss';
import throttle from 'lodash/throttle';

export default function MGSafe() {
  const [state, setState] = useState({ show: false });
  const [mouseDown, setMouseDown] = useState(false);
  const [dial, setDial] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [rotationOffset, setRotationOffset] = useState(0);
  
  const lastClick = useRef(Date.now());
  const dialMax = 100;
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  const clicks = useRef([
    new Howl({
      src: ['https://p--v.b-cdn.net/Safe-Lock-Click-A1.mp3'],
      html5: true,
    }),
    new Howl({
      src: ['https://p--v.b-cdn.net/Safe-Lock-Click-A2.mp3'],
      html5: true,
    }),
    new Howl({
      src: ['https://p--v.b-cdn.net/Safe-Lock-Click-A3.mp3'],
      html5: true,
    }),
    new Howl({
      src: ['https://p--v.b-cdn.net/Safe-Lock-Click-A4.mp3'],
      html5: true,
    }),
  ]);

  const getRotation = (e: MouseEvent) => {
    const { clientX, clientY } = e;
    const angle = (Math.atan2(clientY - centerY, clientX - centerX) * 180) / Math.PI;
    return (Math.round(angle) + 90) % 360;
  };

  const onmousedown = (e: React.MouseEvent<HTMLDivElement>) => {
    setMouseDown(true);
    setRotationOffset(getRotation(e.nativeEvent) - rotation);
  };

  const onmousemove = throttle((e: MouseEvent) => {
    if (!mouseDown) {
      return;
    }
    const newRotation = (getRotation(e) - rotationOffset + 360) % 360;
    setRotation(newRotation);
    const newDial = Math.floor((newRotation / 360) * dialMax);
    if (newDial !== dial) {
      const nextClick = Date.now();
      const deltaClick = nextClick - lastClick.current;
      lastClick.current = nextClick;
      const volumeAdjust = Math.min(Math.max((200 - deltaClick) / 100, 0), 1);

      clicks.current[newDial % clicks.current.length].volume(Math.random() * 0.25 + 0.15 - volumeAdjust * 0.05);
      clicks.current[newDial % clicks.current.length].rate(1 + volumeAdjust);
      clicks.current[newDial % clicks.current.length].play();
    }
    setDial(newDial);
  }, 5);

  const onmouseup = (e: MouseEvent) => {
    setMouseDown(false);
  };

  useEffect(() => {
    document.addEventListener('mouseup', onmouseup);
    document.addEventListener('mousemove', onmousemove, { passive: true });
    
    return () => {
      document.removeEventListener('mouseup', onmouseup);
      document.removeEventListener('mousemove', onmousemove);
    };
  }, [onmousemove, mouseDown, rotation, rotationOffset, dial]);

  return (
    state.show && (
      <div className={styles.mgSafeFrame}>
        <div className={styles.mgDial} onMouseDown={onmousedown} style={{ transform: `rotateZ(${rotation}deg)` }} />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            zIndex: 1,
            fontSize: '12px',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {dial}
        </div>
      </div>
    )
  );
}
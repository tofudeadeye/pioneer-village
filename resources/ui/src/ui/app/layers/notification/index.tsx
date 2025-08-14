import { useState, useEffect } from 'react';
import notificationStore from '../../stores/notification-store';
import styles from './styles.module.scss';

export default function Notification() {
  const [state, setState] = useState(notificationStore.getState());

  useEffect(() => {
    const unsubscribe = notificationStore.subscribe(setState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Store handles all events
  }, []);

  useEffect(() => {
    handleActive();
  }, [state.notifications, state.active]);

  const handleActive = () => {
    if (state.active) {
      return;
    }
    const notification = state.notifications[0];
    if (!notification) {
      return;
    }
    notificationStore.showNotification();
    setTimeout(() => {
      notificationStore.hideNotification();
    }, notification.duration);
  };

  // Map color names to CSS variables
  const getColorVar = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'var(--theme-primary)',
      white: 'var(--theme-white)',
      red: 'var(--theme-danger)',
      green: 'var(--theme-success)',
      yellow: 'var(--theme-warning)',
      black: 'var(--theme-black)',
      gray: 'var(--theme-gray)',
    };
    return colorMap[color] || color;
  };

  return (
    <>
      {state.currentNotification && (
        <div
          className={`${styles.notif} ${state.active ? 'active' : ''}${
            state.currentNotification.centered ? ' centered' : ''
          }`}
          style={{
            backgroundColor: getColorVar(state.currentNotification.bgColor),
            color: getColorVar(state.currentNotification.fgColor),
          }}
        >
          {state.currentNotification.text}
        </div>
      )}
    </>
  );
}
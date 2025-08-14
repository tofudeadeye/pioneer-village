import { useCallback, useEffect, useRef, useState } from 'react';

import Select from '@styled/components/Select';
import Suggestions from '@styled/components/Suggestions';

import { uiSize } from '@uiLib/helpers';
import { useEscapeKey } from '../../hooks/use-game-events';

import chatStore from '../../stores/chat-store';
import styles from './styles.module.scss';

const channels: Record<string, UI.Channel> = {
  general: {
    label: 'General',
    bg: 'black',
    fg: 'white',
  },
  ooc: {
    label: 'OOC',
    bg: 'gray25',
    fg: 'white',
  },
  admin: {
    label: 'Admin',
    bg: 'red',
    fg: 'white',
  },
};

export default function Chat() {
  const [state, setState] = useState(chatStore.getState());
  const refMessages = useRef<HTMLDivElement>(null);
  const refInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = chatStore.subscribe(setState);

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle escape key
  const onEscape = useCallback(() => {
    chatStore.close();
  }, []);

  useEscapeKey(state.show, onEscape);

  // Auto scroll effect
  useEffect(() => {
    if (state.autoScroll) {
      const messagesRef = refMessages.current;
      if (messagesRef) {
        messagesRef.scrollTo({ top: messagesRef.scrollHeight });
      }
    }
  }, [state.messages, state.autoScroll]);

  // Focus input when opening
  useEffect(() => {
    if (state.show) {
      setTimeout(() => {
        refInput.current?.focus();
      }, 10);
    }
  }, [state.show]);

  const getChannelStyle = (channel: string) => {
    let backgroundColor = 'var(--theme-black)';
    let color = 'var(--theme-white)';
    if (channels[channel]) {
      const bgColor = channels[channel].bg;
      const fgColor = channels[channel].fg;
      
      if (bgColor === 'black') backgroundColor = 'var(--theme-black)';
      else if (bgColor === 'gray25') backgroundColor = 'var(--theme-gray25)';
      else if (bgColor === 'red') backgroundColor = 'var(--theme-red)';
      
      if (fgColor === 'white') color = 'var(--theme-white)';
      else if (fgColor === 'black') color = 'var(--theme-black)';
    }
    return { backgroundColor, color };
  };

  const handleMouseWheel = (e: React.WheelEvent) => {
    chatStore.handleMouseWheel(e.nativeEvent, refMessages.current);
  };

  const checkChannels = (input: HTMLInputElement): boolean => {
    for (const channel of Object.keys(channels)) {
      if (input.value.toLowerCase() === `/${channel} `) {
        input.value = '';
        chatStore.selectChannel(channel);
        return true;
      }
    }
    for (const channel of Object.keys(channels)) {
      if (input.value.toLowerCase() === '/s ' || input.value.toLowerCase() === '/g ') {
        input.value = '';
        chatStore.selectChannel('general');
        return true;
      }
    }
    return false;
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = refInput.current;
    if (input) {
      let text = input.value;
      if (state.currentInput !== text) {
        if (checkChannels(input)) {
          return;
        }
        chatStore.setCurrentInput(text);
      }

      if (e.key === 'Enter') {
        input.value = '';
        if (text) {
          chatStore.sendMessage(text);
        }
      }

      if (e.key === 'ArrowUp') {
        const message = chatStore.getPreviousMessage();
        if (message !== null) {
          input.value = message;
        }
      }

      if (e.key === 'ArrowDown') {
        const message = chatStore.getNextMessage();
        input.value = message || '';
      }
    }
  };

  const selectChannel = (channel: string) => {
    chatStore.selectChannel(channel);
  };

  return (
    <div className={`${styles.frame} ${state.show ? styles.active : state.partialShow ? styles.partial : ''}`}>
      <div className={styles.messages} ref={refMessages} onWheel={handleMouseWheel}>
        {state.messages.map((message, index) => (
          <div key={index} className={styles.message} style={getChannelStyle(message.channel)}>
            {message.channel && message.channel !== 'general' && <span className={styles.channel}>[{channels[message.channel].label}]</span>}
            {message.sender && (
              <span className={styles.sender}>
                {message.sender} {message.id && <>[{message.id}]</>}
              </span>
            )}
            {message.text}
          </div>
        ))}
      </div>
      <div className={`${styles.input} ${state.show ? styles.active : ''}`} style={getChannelStyle(state.currentChannel)}>
        <Select
          style="chat"
          options={channels}
          selected={state.currentChannel}
          onChange={(option) => selectChannel(option)}
        />
        <input ref={refInput} type="text" onKeyUp={handleKeyUp} />
        <Suggestions
          input={refInput?.current?.value || ''}
          suggestions={state.suggestions}
          active={!!refInput?.current?.value}
          style={{
            position: 'absolute',
            top: `calc(100% + ${uiSize(8)})`,
            right: 0,
            left: 0,
          }}
        />
      </div>
    </div>
  );
}

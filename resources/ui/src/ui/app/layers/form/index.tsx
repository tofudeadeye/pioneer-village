import { useState, useEffect, useCallback } from 'react';

import coreStyles from '../../styles/core.module.scss';

import formStore from '../../stores/form-store';
import { useEscapeKey } from '../../hooks/use-game-events';

export default function Form() {
  const [state, setState] = useState(formStore.getState());

  useEffect(() => {
    const unsubscribe = formStore.subscribe(setState);
    return unsubscribe;
  }, []);

  // Store handles all events

  // Handle escape key
  const onEscape = useCallback(() => {
    formStore.close();
  }, []);

  useEscapeKey(state.show, onEscape);

  const updateText = (text: string) => {
    formStore.setText(text);
  };

  const submit = () => {
    formStore.submit();
  };

  return (
    state.show && (
      <div className={coreStyles.modal}>
        <h1 className={coreStyles.headline}>{state.title}</h1>
        <form>
          <div>
            <input type="text" value={state.text} onInput={(e: React.FormEvent<HTMLInputElement>) => updateText(e.currentTarget.value)} />
          </div>
          <br />
          <br />
          <button type="submit" onClick={submit}>
            Submit
          </button>
        </form>
      </div>
    )
  );
}
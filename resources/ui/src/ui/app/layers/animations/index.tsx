import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { useEscapeKey } from '../../hooks/use-game-events';
import animationsStore from '../../stores/animations-store';
import styles from './styles.module.scss';

export default function Animations() {
  const state = useSyncExternalStore(animationsStore.subscribe, animationsStore.getState);

  const onEscape = useCallback(() => {
    animationsStore.close();
  }, []);

  useEscapeKey(state.show, onEscape);

  const setQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
    animationsStore.setQuery(e.target.value);
  };

  const setDict = (e: React.ChangeEvent<HTMLSelectElement>) => {
    animationsStore.setDict(e.target.value);
  };

  const setClip = (e: React.ChangeEvent<HTMLSelectElement>) => {
    animationsStore.setClip(e.target.value);
  };

  const updateFlag = (e: React.ChangeEvent<HTMLInputElement>) => {
    const flagNumber = Number(e.target.value);
    animationsStore.updateFlag(flagNumber, e.target.checked);
  };

  const setEntity = (e: React.ChangeEvent<HTMLInputElement>) => {
    animationsStore.setEntity(Number(e.target.value));
  };

  const setBlendInSpeed = (e: React.ChangeEvent<HTMLInputElement>) => {
    animationsStore.setBlendInSpeed(Number(e.target.value));
  };

  const setBlendOutSpeed = (e: React.ChangeEvent<HTMLInputElement>) => {
    animationsStore.setBlendOutSpeed(Number(e.target.value));
  };

  const playAnim = () => {
    animationsStore.playAnimation();
  };

  const stopAnim = () => {
    animationsStore.stopAnimation();
  };

  // Derive from state, not store methods
  const hasFlag = (flag: number) => (state.flags & flag) !== 0;

  const filteredDictionaries = useMemo(() => {
    if (!state.query) {
      return Object.keys(state.animations);
    }
    const terms = state.query.toLowerCase().split(' ');
    return Object.keys(state.animations).filter((animationDict) => {
      return terms.every((term) => {
        if (term.startsWith('!')) {
          return !animationDict.toLowerCase().includes(term.substring(1));
        }
        return animationDict.toLowerCase().includes(term);
      });
    });
  }, [state.query, state.animations]);

  const clips = useMemo(() => {
    if (!state.dict || !state.animations[state.dict]) {
      return [];
    }
    return state.animations[state.dict];
  }, [state.dict, state.animations]);

  const animationConfigString = useMemo(() => {
    const flagStrings: string[] = [];
    if (state.flags & 1) flagStrings.push('AnimFlag.REPEAT');
    if (state.flags & 2) flagStrings.push('AnimFlag.STOP_LAST_FRAME');
    if (state.flags & 4) flagStrings.push('AnimFlag.UNK_4');
    if (state.flags & 8) flagStrings.push('AnimFlag.UPPERBODY');
    if (state.flags & 16) flagStrings.push('AnimFlag.ENABLE_PLAYER_CONTROL');
    if (state.flags & 32) flagStrings.push('AnimFlag.CANCELABLE');
    if (state.flags & 64) flagStrings.push('AnimFlag.UNK_64');
    if (state.flags & 128) flagStrings.push('AnimFlag.OFFSET_POSITION');
    if (state.flags & 256) flagStrings.push('AnimFlag.OFFSET_POSITION_ENTITY');
    if (state.flags & 512) flagStrings.push('AnimFlag.UNK_512');
    if (state.flags & 1024) flagStrings.push('AnimFlag.UNK_1024');
    if (state.flags & 2048) flagStrings.push('AnimFlag.UNK_2048');
    if (state.flags & 4096) flagStrings.push('AnimFlag.UNK_4096');
    if (state.flags & 8192) flagStrings.push('AnimFlag.UNK_8192');
    if (state.flags & 16384) flagStrings.push('AnimFlag.UNK_16384');
    if (state.flags & 32768) flagStrings.push('AnimFlag.UNK_IS_ENTITY');

    return `{
    dict: '${state.dict}',
    anim: '${state.clip}',${
      state.flags !== 0
        ? `
    flags: ${flagStrings.join(' + ')},`
        : ''
    }
    blendInSpeed: ${state.blendInSpeed},
    blendOutSpeed: ${state.blendOutSpeed},
}`;
  }, [state.dict, state.clip, state.flags, state.blendInSpeed, state.blendOutSpeed]);

  return (
    state.show && (
      <div className={styles.animationsContainer}>
        <div>
          <input name="query" type="text" value={state.query} onChange={setQuery} style={{ width: '100%' }} />
        </div>
        <div style={{ display: 'flex' }}>
          <select style={{ width: '66%' }} onChange={setDict} value={state.dict}>
            <option value="">Choose Dictionary</option>
            {filteredDictionaries.map((animationDict) => (
              <option key={animationDict} value={animationDict}>
                {animationDict}
              </option>
            ))}
          </select>
          <select style={{ width: '33%' }} onChange={setClip} value={state.clip} disabled={state.dict === ''}>
            <option value="">Choose Clip</option>
            {clips.map((animation) => (
              <option key={animation} value={animation}>
                {animation}
              </option>
            ))}
          </select>
          <button onClick={playAnim}>Play</button>
          <button onClick={stopAnim}>Stop</button>
        </div>
        <div>
          <table>
            <tbody>
              <tr>
                <td>
                  <label>
                    <input type="checkbox" value={0} checked={true} disabled />
                    <span>Normal</span>
                  </label>
                </td>
                <td>
                  <label>
                    <input type="checkbox" value={1} checked={hasFlag(1)} onChange={updateFlag} />
                    <span>Repeat</span>
                  </label>
                </td>
                <td>
                  <label>
                    <input type="checkbox" value={2} checked={hasFlag(2)} onChange={updateFlag} />
                    <span>Stop Last Frame</span>
                  </label>
                </td>
                <td>
                  <label>
                    <input type="checkbox" value={4} checked={hasFlag(4)} onChange={updateFlag} />
                    <span>Unknown 4</span>
                  </label>
                </td>
                <td>
                  <label>
                    <input type="checkbox" value={8} checked={hasFlag(8)} onChange={updateFlag} />
                    <span>UpperBody</span>
                  </label>
                </td>
              </tr>
              <tr>
                <td>
                  <label>
                    <input type="checkbox" value={16} checked={hasFlag(16)} onChange={updateFlag} />
                    <span>Enable Player Control</span>
                  </label>
                </td>
                <td>
                  <label>
                    <input type="checkbox" value={32} checked={hasFlag(32)} onChange={updateFlag} />
                    <span>Cancelable</span>
                  </label>
                </td>
                <td>
                  <label>
                    <input type="checkbox" value={64} checked={hasFlag(64)} onChange={updateFlag} />
                    <span>Unknown 64</span>
                  </label>
                </td>
                <td>
                  <label>
                    <input type="checkbox" value={128} checked={hasFlag(128)} onChange={updateFlag} />
                    <span>Offset Position</span>
                  </label>
                </td>
                <td>
                  <label>
                    <input type="checkbox" value={256} checked={hasFlag(256)} onChange={updateFlag} />
                    <span>Offset Position Entity</span>
                  </label>
                </td>
              </tr>
              <tr>
                <td>
                  <label>
                    <input type="checkbox" value={512} checked={hasFlag(512)} onChange={updateFlag} />
                    <span>Unk 512</span>
                  </label>
                </td>
                <td>
                  <label>
                    <input type="checkbox" value={1024} checked={hasFlag(1024)} onChange={updateFlag} />
                    <span>Unk 1024</span>
                  </label>
                </td>
                <td>
                  <label>
                    <input type="checkbox" value={2048} checked={hasFlag(2048)} onChange={updateFlag} />
                    <span>Unk 2048</span>
                  </label>
                </td>
                <td>
                  <label>
                    <input type="checkbox" value={4096} checked={hasFlag(4096)} onChange={updateFlag} />
                    <span>Unk 4096</span>
                  </label>
                </td>
                <td>
                  <label>
                    <input type="checkbox" value={8192} checked={hasFlag(8192)} onChange={updateFlag} />
                    <span>Unk 8192</span>
                  </label>
                </td>
              </tr>
              <tr>
                <td>
                  <label>
                    <input type="checkbox" value={16384} checked={hasFlag(16384)} onChange={updateFlag} />
                    <span>Unk 16384</span>
                  </label>
                </td>
                <td>
                  <label>
                    <input type="checkbox" value={32768} checked={hasFlag(32768)} onChange={updateFlag} />
                    <span>Unknown Is Entity</span>
                  </label>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <label>Entity:</label>
          <input name="entity" type="number" step={1} value={state.entity} onChange={setEntity} />
          <label>Blend In Speed:</label>
          <input name="blendInSpeed" type="number" step={1} value={state.blendInSpeed} onChange={setBlendInSpeed} />
          <label>Blend Out Speed:</label>
          <input name="blendOutSpeed" type="number" step={1} value={state.blendOutSpeed} onChange={setBlendOutSpeed} />
        </div>
        <div>
          <pre>{animationConfigString}</pre>
        </div>
      </div>
    )
  );
}

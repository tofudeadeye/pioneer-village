import { useCallback, useEffect, useState } from 'react';

import { useEscapeKey } from '../../hooks/use-game-events';
import animationsStore from '../../stores/animations-store';
import styles from './styles.module.scss';

export default function Animations() {
  const [state, setState] = useState(animationsStore.getState());

  useEffect(() => {
    const unsubscribe = animationsStore.subscribe(setState);

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle escape key
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

  const filteredDictionaries = animationsStore.getFilteredDictionaries();
  const clips = animationsStore.getClips();
  const flagsString = animationsStore.getFlagsString();
  const animationConfigString = animationsStore.getAnimationConfigString();

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
                    <input type="checkbox" value={1} checked={animationsStore.hasFlag(1)} onChange={updateFlag} />
                    <span>Repeat</span>
                  </label>
                </td>
                <td>
                  <label>
                    <input type="checkbox" value={2} checked={animationsStore.hasFlag(2)} onChange={updateFlag} />
                    <span>Stop Last Frame</span>
                  </label>
                </td>
                <td>
                  <label>
                    <input type="checkbox" value={4} checked={animationsStore.hasFlag(4)} onChange={updateFlag} />
                    <span>Unknown 4</span>
                  </label>
                </td>
                <td>
                  <label>
                    <input type="checkbox" value={8} checked={animationsStore.hasFlag(8)} onChange={updateFlag} />
                    <span>UpperBody</span>
                  </label>
                </td>
              </tr>
              <tr>
                <td>
                  <label>
                    <input type="checkbox" value={16} checked={animationsStore.hasFlag(16)} onChange={updateFlag} />
                    <span>Enable Player Control</span>
                  </label>
                </td>
                <td>
                  <label>
                    <input type="checkbox" value={32} checked={animationsStore.hasFlag(32)} onChange={updateFlag} />
                    <span>Cancelable</span>
                  </label>
                </td>
                <td>
                  <label>
                    <input type="checkbox" value={64} checked={animationsStore.hasFlag(64)} onChange={updateFlag} />
                    <span>Unknown 64</span>
                  </label>
                </td>
                <td>
                  <label>
                    <input type="checkbox" value={128} checked={animationsStore.hasFlag(128)} onChange={updateFlag} />
                    <span>Offset Position</span>
                  </label>
                </td>
                <td>
                  <label>
                    <input type="checkbox" value={256} checked={animationsStore.hasFlag(256)} onChange={updateFlag} />
                    <span>Offset Position Entity</span>
                  </label>
                </td>
              </tr>
              <tr>
                <td>
                  <label>
                    <input type="checkbox" value={512} checked={animationsStore.hasFlag(512)} onChange={updateFlag} />
                    <span>Unk 512</span>
                  </label>
                </td>
                <td>
                  <label>
                    <input type="checkbox" value={1024} checked={animationsStore.hasFlag(1024)} onChange={updateFlag} />
                    <span>Unk 1024</span>
                  </label>
                </td>
                <td>
                  <label>
                    <input type="checkbox" value={2048} checked={animationsStore.hasFlag(2048)} onChange={updateFlag} />
                    <span>Unk 2048</span>
                  </label>
                </td>
                <td>
                  <label>
                    <input type="checkbox" value={4096} checked={animationsStore.hasFlag(4096)} onChange={updateFlag} />
                    <span>Unk 4096</span>
                  </label>
                </td>
                <td>
                  <label>
                    <input type="checkbox" value={8192} checked={animationsStore.hasFlag(8192)} onChange={updateFlag} />
                    <span>Unk 8192</span>
                  </label>
                </td>
              </tr>
              <tr>
                <td>
                  <label>
                    <input
                      type="checkbox"
                      value={16384}
                      checked={animationsStore.hasFlag(16384)}
                      onChange={updateFlag}
                    />
                    <span>Unk 16384</span>
                  </label>
                </td>
                <td>
                  <label>
                    <input
                      type="checkbox"
                      value={32768}
                      checked={animationsStore.hasFlag(32768)}
                      onChange={updateFlag}
                    />
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

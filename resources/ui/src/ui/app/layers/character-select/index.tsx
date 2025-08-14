import { useState, useEffect } from 'react';
import characterSelectStore from '../../stores/character-select-store';

import styles from './styles.module.scss';

export default function CharacterSelect() {
  const [state, setState] = useState(characterSelectStore.getState());

  useEffect(() => {
    const unsubscribe = characterSelectStore.subscribe(setState);
    
    return () => {
      unsubscribe();
    };
  }, []);

  const characterStyle = (character: UI.CharacterSelect.CharacterData) => {
    if (!character.pos) {
      return {};
    }
    return {
      position: 'fixed' as const,
      top: `${character.pos.y * 100}%`,
      left: `${character.pos.x * 100}%`,
    };
  };

  const chooseCharacter = (characterId: number) => {
    characterSelectStore.chooseCharacter(characterId);
  };

  const createCharacter = () => {
    characterSelectStore.createCharacter();
  };

  return (
    <>
      {state.show && (
        <>
          <div className={styles.characters}>
            {state.characters.map((character) => {
              return (
                <div
                  key={character.id}
                  className={`${styles.characterLabel} ${character.pos ? styles.positioned : ''}`}
                  style={characterStyle(character)}
                  onClick={() => chooseCharacter(character.id)}
                >
                  {character.firstName} {character.lastName}
                </div>
              );
            })}
          </div>
          <div className={styles.createCharacter} onClick={createCharacter}>
            Create Character
          </div>
        </>
      )}
    </>
  );
}
import Check from '@fa/5/duotone/check.svg';
import Times from '@fa/5/duotone/times.svg';
import TrashAlt from '@fa/5/solid/trash-alt.svg';
import { useEffect, useState } from 'react';

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

  const deleteCharacter = (characterId: number) => {
    characterSelectStore.setState({ isDeleting: true, deleteConfirmId: characterId });
  };

  const cancelDeleteCharacter = () => {
    characterSelectStore.setState({ isDeleting: false });
  };

  const confirmDeleteCharacter = () => {
    if (state.deleteConfirmId !== null) {
      characterSelectStore.deleteCharacter(state.deleteConfirmId);
      characterSelectStore.setState({ isDeleting: false });
    }
  };

  const createCharacter = () => {
    characterSelectStore.createCharacter();
  };

  const deleteCharacterName = () => {
    const character = state.characters.find((c) => c.id === state.deleteConfirmId);
    if (character) {
      return `${character.firstName} ${character.lastName}`;
    }
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
                  className={`${styles.characterLabel} ${character.pos ? styles.positioned : styles.unpositioned}`}
                  style={characterStyle(character)}
                >
                  <div className={styles.characterName} onClick={() => chooseCharacter(character.id)}>
                    {character.firstName} {character.lastName}
                  </div>

                  <div className={styles.deleteCharacter} onClick={() => deleteCharacter(character.id)}>
                    <TrashAlt />
                  </div>
                </div>
              );
            })}
          </div>
          <div className={styles.createCharacter} onClick={createCharacter}>
            Create Character
          </div>

          <div className={`${styles.deleteCharacterModal} ${state.isDeleting ? styles.show : ''}`}>
            <p>Delete {deleteCharacterName()}?</p>
            <div className={styles.modalButtons}>
              <button onClick={() => cancelDeleteCharacter()}>
                <Times />
              </button>
              <button onClick={() => confirmDeleteCharacter()}>
                <Check />
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

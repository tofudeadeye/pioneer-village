import Check from '@fa/5/duotone/check.svg';
import Times from '@fa/5/duotone/times.svg';
import { type MouseEvent, useEffect, useState } from 'react';

import customizationStore from '../../stores/customization-store';
import EquippedSidebar from './components/equipped-sidebar';
import RotationSlider from './components/rotation-slider';
import styles from './styles.module.scss';
import BodyTab from './tabs/body-tab';
import ClothingTab from './tabs/clothing-tab';
import HeadTab from './tabs/head-tab';
import InfoTab from './tabs/info-tab';
import OverlaysTab from './tabs/overlays-tab';

type TabKey = 'info' | 'head' | 'body' | 'overlays' | 'clothing';

const TABS: TabKey[] = ['info', 'head', 'overlays', 'body', 'clothing'];

function convertComponent(
  comp: UI.Customization.ComponentJsonData | UI.Customization.ComponentJsonDataPalette,
): UI.Customization.StyleColorComponentData {
  const data: UI.Customization.StyleColorComponentData = {
    name: comp.name || '',
    type: comp.type,
    component: comp.component,
    swatchTexture: comp.swatchTexture,
    drawable: comp.drawable,
    tintable: Boolean(
      comp.swatchTexture &&
        // comp.tint0 !== null &&
        // comp.tint1 !== null &&
        // comp.tint2 !== null &&
        !(comp.tint0 === 255 && comp.tint1 === 255),
    ),
  };

  if ('palette' in comp && comp.palette !== undefined && comp.palette !== '') {
    const palette = Array.isArray(comp.palette) ? comp.palette[0] : comp.palette;
    const tint0 = Array.isArray(comp.tint0) ? comp.tint0[0] : comp.tint0;
    const tint1 = Array.isArray(comp.tint1) ? comp.tint1[0] : comp.tint1;
    const tint2 = Array.isArray(comp.tint2) ? comp.tint2[0] : comp.tint2;

    if (palette === '' || palette === undefined) {
      return data;
    }

    return {
      ...data,
      palette,
      tint0: tint0 as number,
      tint1: tint1 as number,
      tint2: tint2 as number,
    };
  }

  return data;
}

export default function Customization() {
  const [state, setState] = useState(customizationStore.getState());
  const [activeTab, setActiveTab] = useState<TabKey>('info');

  useEffect(() => {
    const unsubscribe = customizationStore.subscribe(setState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    customizationStore.initializeClientHandlers();
  }, []);

  // Sync activeTab when store state changes to a valid tab
  useEffect(() => {
    const tabKeys: TabKey[] = ['info', 'head', 'overlays', 'body', 'clothing'];
    if (tabKeys.includes(state.state as TabKey)) {
      setActiveTab(state.state as TabKey);
    }
  }, [state.state]);

  const handleTabChange = (tab: TabKey): void => {
    setActiveTab(tab);
    customizationStore.setState(tab);
  };

  const setTintByCategory = (category: string, tint: Customization.Palette): void => {
    console.log('Setting tint for category', category, tint);
    customizationStore.setTintByCategory(category, tint);
  };

  const setComponent = (componentType: string, style: number, option: number): void => {
    customizationStore.setComponent(componentType, style, option);
  };

  const handleHighlightGender = (gender: 'male' | 'female', _e: MouseEvent<HTMLDivElement>): void => {
    customizationStore.highlightGender(gender);
  };

  const handleChooseGender = (_e: MouseEvent<HTMLDivElement>): void => {
    customizationStore.chooseGender();
  };

  const handleSetState = (newState: Customization.State): void => {
    customizationStore.setState(newState);
    if (newState === 'finalize') {
      handleEndConfirm();
    } else if (newState === 'exit') {
      handleEndExit();
    }
  };

  const handleStartConfirm = (): void => {
    if (!state.firstName || !state.lastName || !state.dateOfBirth) return;
    customizationStore.updateState({
      confirming: true,
    });
  };

  const handleEndConfirm = (): void => {
    customizationStore.updateState({
      confirming: false,
    });
  };

  const handleStartExit = (): void => {
    customizationStore.updateState({
      exiting: true,
    });
  };

  const handleEndExit = (): void => {
    customizationStore.updateState({
      exiting: false,
    });
  };

  const handleChangeSkinTone = (value: number): void => {
    customizationStore.setSkinTone(value);
  };

  const handleChangeHead = (value: number): void => {
    customizationStore.setHead(value);
  };

  const handleChangeTeeth = (value: number): void => {
    customizationStore.setTeeth(value);
  };

  const handleChangeBodyType = (value: number): void => {
    customizationStore.setBodyType(value);
  };

  const handleChangeFaceFeature = (feature: number, value: number): void => {
    customizationStore.setFaceFeature(feature, value);
  };

  const handleRotation = (value: number): void => {
    customizationStore.handleRotation(value);
  };

  const changeLayers = (layers: UI.Customization.LayerData[]): void => {
    customizationStore.setCurrentLayers(layers);
  };

  if (!state.show) {
    return null;
  }

  return (
    <div className={styles.customization}>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <filter id="tintBlur">
          <feGaussianBlur stdDeviation="8 1" />
        </filter>
      </svg>
      {/* Gender Selection */}
      {state.state === 'gender' && (
        <>
          <div
            className={
              state.gender === 'male' ? `${styles.genderSelect} ${styles.genderSelectActive}` : styles.genderSelect
            }
            style={{ left: 0 }}
            onMouseEnter={(e) => handleHighlightGender('male', e)}
            onMouseDown={handleChooseGender}
          />
          <div
            className={
              state.gender === 'female' ? `${styles.genderSelect} ${styles.genderSelectActive}` : styles.genderSelect
            }
            style={{ right: 0 }}
            onMouseEnter={(e) => handleHighlightGender('female', e)}
            onMouseDown={handleChooseGender}
          />
        </>
      )}

      {/* Exit Modal */}
      <div className={`${styles.exitModal} ${state.exiting ? styles.exitModalShow : ''}`}>
        <div className={styles.exitModalContent}>
          <p>Exit character creation?</p>
          <div className={styles.exitModalButtons}>
            <button onClick={handleEndExit}>
              <Times />
            </button>
            <button onClick={() => handleSetState('exit')}>
              <Check />
            </button>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      {state.state !== 'gender' && state.state !== 'transition' && (
        <>
          <EquippedSidebar
            currentComponents={state.currentComponents}
            componentsData={customizationStore.getComponentsData()}
            tints={state.tints}
            gender={state.gender}
            onRemove={(category) => customizationStore.removeComponent(category)}
            onWearableStateChange={(category, wState) => customizationStore.setWearableState(category, wState)}
          />
          <div className={styles.panel}>
            <div className={styles.tabBar}>
              {TABS.map((tab) => (
                <button
                  key={tab}
                  className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                  onClick={() => handleTabChange(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className={styles.tabContent}>
              <div style={{ display: activeTab === 'info' ? undefined : 'none' }}>
                <InfoTab
                  firstName={state.firstName}
                  lastName={state.lastName}
                  dateOfBirth={state.dateOfBirth}
                  onFirstNameChange={(v) => customizationStore.setFirstName(v)}
                  onLastNameChange={(v) => customizationStore.setLastName(v)}
                  onDateOfBirthChange={(v) => customizationStore.setDateOfBirth(v)}
                />
              </div>
              <div style={{ display: activeTab === 'head' ? undefined : 'none' }}>
                <HeadTab
                  gender={state.gender}
                  head={state.head}
                  teeth={state.teeth}
                  currentFaceFeatures={state.currentFaceFeatures}
                  currentComponents={state.currentComponents}
                  componentsData={customizationStore.getComponentsData()}
                  tints={state.tints}
                  onHeadChange={handleChangeHead}
                  onTeethChange={handleChangeTeeth}
                  onFaceFeatureChange={handleChangeFaceFeature}
                  onComponentChange={setComponent}
                  onTintChange={setTintByCategory}
                  convertComponent={convertComponent}
                />
              </div>
              <div style={{ display: activeTab === 'body' ? undefined : 'none' }}>
                <BodyTab
                  gender={state.gender}
                  skinTone={state.skinTone}
                  bodyType={state.bodyType}
                  currentFaceFeatures={state.currentFaceFeatures}
                  onSkinToneChange={handleChangeSkinTone}
                  onBodyTypeChange={handleChangeBodyType}
                  onFaceFeatureChange={handleChangeFaceFeature}
                />
              </div>
              <div style={{ display: activeTab === 'overlays' ? undefined : 'none' }}>
                <OverlaysTab
                  overlays={customizationStore.getOverlaysData()}
                  currentLayers={state.currentLayers}
                  onLayersChange={changeLayers}
                />
              </div>
              <div style={{ display: activeTab === 'clothing' ? undefined : 'none' }}>
                <ClothingTab
                  gender={state.gender}
                  currentComponents={state.currentComponents}
                  componentsData={customizationStore.getComponentsData()}
                  tints={state.tints}
                  onComponentChange={setComponent}
                  onTintChange={setTintByCategory}
                  convertComponent={convertComponent}
                />
              </div>
            </div>

            <div className={styles.panelFooter}>
              <button className={styles.btnRandomize} onClick={handleStartExit}>
                Exit
              </button>
              <button
                className={`${styles.btnConfirm} ${
                  !state.firstName || !state.lastName || !state.dateOfBirth ? styles.btnConfirmDisabled : ''
                }`}
                onClick={handleStartConfirm}
              >
                {state.confirming ? 'Are you sure?' : 'Confirm'}
              </button>
            </div>

            {state.confirming && (
              <div className={styles.panelFooter}>
                <button className={styles.btnRandomize} onClick={handleEndConfirm}>
                  Cancel
                </button>
                <button className={styles.btnConfirm} onClick={() => handleSetState('finalize')}>
                  Finalize
                </button>
              </div>
            )}
          </div>

          <div className={styles.bottomControls}>
            <RotationSlider value={state.rotation} onChange={handleRotation} />
          </div>
        </>
      )}
    </div>
  );
}

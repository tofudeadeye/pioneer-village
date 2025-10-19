import Child from '@fa/5/duotone/child.svg';
import HeadSide from '@fa/5/duotone/head-side.svg';
import InfoSquare from '@fa/5/duotone/info-square.svg';
import Save from '@fa/5/duotone/save.svg';
import Tshirt from '@fa/5/duotone/tshirt.svg';
import VenusMars from '@fa/5/duotone/venus-mars.svg';
import { debounce } from 'lodash';
import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

import { LoadResourceJson } from '@lib/ui';

import customizationStore from '../../stores/customization-store';
import OverlaySelector from './components/OverlaySelector';
import RangeSlider from './components/RangeSlider';
import StyleColorSelector from './components/StyleColorSelector';
import TintSelector from './components/TintSelector';
import XYSlider from './components/XYSlider';
import componentStyles from './components/styles.module.scss';
import styles from './styles.module.scss';

const componentFiles = [
  '2886757168',
  'accessories',
  'ammo_pistols',
  'ammo_rifles',
  'aprons',
  'armor',
  'badges',
  'beards_chin',
  'beards_chops',
  'beards_complete',
  'beards_mustache',
  'belt_buckles',
  'belts',
  'bodies_lower',
  'bodies_upper',
  'boot_accessories',
  'boots',
  'chaps',
  'cloaks',
  'coats',
  'coats_closed',
  'dresses',
  'eyes',
  'eyewear',
  'gauntlets',
  'gloves',
  'gunbelt_accs',
  'gunbelts',
  'hair',
  'hair_accessories',
  'hats',
  'heads',
  'holsters_crossdraw',
  'holsters_knife',
  'holsters_left',
  'holsters_right',
  'horse_accessories',
  'horse_bedrolls',
  'horse_blankets',
  'horse_bridles',
  'horse_manes',
  'horse_mustache',
  'horse_saddlebags',
  'horse_saddles',
  'horse_shoes',
  'horse_tails',
  'jewelry_bracelets',
  'jewelry_rings_left',
  'jewelry_rings_right',
  'loadouts',
  'masks',
  'masks_large',
  'neckties',
  'neckwear',
  'pants',
  'ponchos',
  'saddle_horns',
  'saddle_lanterns',
  'saddle_stirrups',
  'satchels',
  'shirts_full',
  'skirts',
  'spats',
  'suspenders',
  'talisman_belt',
  'talisman_holster',
  'talisman_satchel',
  'talisman_wrist',
  'teeth',
  'vests',
];

const pedComponentCategories = [
  'hats',
  'eyewear',
  'neckties',
  'neckwear',

  'shirts_full',
  'vests',
  'coats',
  'coats_closed',
  'cloaks',
  'ponchos',
  'aprons',
  'dresses',
  'skirts',

  'gloves',
  'gauntlets',

  'belts',
  'belt_buckles',
  'gunbelts',
  'gunbelt_accs',
  'holsters_left',
  'holsters_right',
  'holsters_crossdraw',
  'holsters_knife',

  'pants',
  'chaps',

  'boots',
  'boot_accessories',
  'spats',

  'suspenders',

  'satchels',

  'jewelry_bracelets',
  'jewelry_rings_left',
  'jewelry_rings_right',

  'talisman_belt',
  'talisman_holster',
  'talisman_satchel',
  'talisman_wrist',

  'hair_accessories',
  'hair',
  'beards_complete',
  'beards_chin',
  'beards_chops',
  'beards_mustache',

  'masks',
  'masks_large',

  'accessories',
  'badges',

  'armor',
  'loadouts',
];

const bodyTypes = ['Skinny', 'Normal', 'Slim', 'Broad', 'Stocky'];

const teethTypes = [
  'Good Teeth',
  'Slightly Crooked',
  'Yellowish',
  'Dark Yellowish',
  'Black Missing Tooth',
  'Blackened',
  'Metal Tooth',
];

const horseComponentCategories = ['head', 'hand', 'hair', 'mane', 'teef'];

const faceFeatures = [
  {
    id: 34006,
    label: 'Head Width',
    min: -2,
    max: 3,
  },
  {
    id: 41396,
    label: 'Face Width',
    min: -2,
    max: 2,
  },
  {
    id: 13059,
    label: 'Eyebrow Height',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 12281,
    label: 'Eyebrow Width',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 19153,
    label: 'Eyebrow Depth',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 49231,
    label: 'Ears Depth',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 46798,
    label: 'Ears Angle',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 10308,
    label: 'Ears Height',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 60720,
    label: 'Earlobes',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 27147,
    label: 'Cheekbones Height',
    min: -2.5,
    max: 2.5,
  },
  {
    id: 43983,
    label: 'Cheekbones Width',
    min: -4,
    max: 3.5,
  },
  {
    id: 13709,
    label: 'Cheekbones Depth',
    min: -2.5,
    max: 2.5,
  },
  {
    id: 15375,
    label: 'Chin Height',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 50098,
    label: 'Chin Width',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 58147,
    label: 'Chin Depth',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 35627,
    label: 'Eyelid Height',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 7019,
    label: 'Eyelid Width',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 60996,
    label: 'Eyes Depth',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 53862,
    label: 'Eyes Angle',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 42318,
    label: 'Eyes Distance',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 56827,
    label: 'Eyes Height',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 28287,
    label: 'Nose Width',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 13425,
    label: 'Nose Depth',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 1013,
    label: 'Nose Height',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 13489,
    label: 'Nose Angle',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 61782,
    label: 'Nose Curvature',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 22046,
    label: 'Nostrils Distance',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 61541,
    label: 'Mouth Width',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 43625,
    label: 'Mouth Depth',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 31427,
    label: 'Mouth X Position',
    min: -1,
    max: 1,
  },
  {
    id: 16653,
    label: 'Mouth Y Position',
    min: -1,
    max: 1,
  },
  {
    id: 6656,
    label: 'Upper Lip Height',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 37313,
    label: 'Upper Lip Width',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 50037,
    label: 'Upper Lip Depth',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 47949,
    label: 'Lower Lip Height',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 45232,
    label: 'Lower Lip Width',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 23830,
    label: 'Lower Lip Depth',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 36106,
    label: 'Jaw Height',
    min: -2.5,
    max: 1.5,
  },
  {
    id: 60334,
    label: 'Jaw Width',
    min: -2,
    max: 2.5,
  },
  {
    id: 7670,
    label: 'Jaw Depth',
    min: -2.5,
    max: 2.5,
  },
  {
    id: 55182,
    label: 'Jaw Y Position',
    min: -1,
    max: 1,
  },
  {
    id: 57350,
    label: 'Mouth Corner Left Width',
    min: 0,
    max: 1.5,
  },
  {
    id: 40950,
    label: 'Mouth Corner Left Depth',
    min: 0,
    max: 1.5,
  },
  {
    id: 46661,
    label: 'Mouth Corner Left Height',
    min: 0,
    max: 1.5,
  },
  {
    id: 22344,
    label: 'Mouth Corner Left Upper Lip Distance',
    min: 0,
    max: 1.5,
  },
  {
    id: 60292,
    label: 'Mouth Corner Right Upper Lip Distance',
    min: 0,
    max: 1.5,
  },
  {
    id: 49299,
    label: 'Mouth Corner Right Height',
    min: 0,
    max: 1.5,
  },
  {
    id: 9423,
    label: 'Mouth Corner Right Depth',
    min: 0,
    max: 1.5,
  },
  {
    id: 55718,
    label: 'Mouth Corner Right Width',
    min: 0,
    max: 1.5,
  },
  {
    id: 22421,
    label: 'Right Eyelid Open/Close',
    min: -1,
    max: 1,
  },
  {
    id: 52902,
    label: 'Left Eyelid Open/Close',
    min: -1,
    max: 1,
  },
  {
    id: 36277,
    label: 'Neck Width',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 60890,
    label: 'Neck Depth',
    min: -1,
    max: 1,
  },
];

export default function Customization() {
  const [state, setState] = useState(customizationStore.getState());

  useEffect(() => {
    const unsubscribe = customizationStore.subscribe(setState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    customizationStore.initializeClientHandlers();
  }, []);

  const setTintByCategory = (category: string, tint: Customization.Palette) => {
    customizationStore.setTintByCategory(category, tint);
  };

  const getComponentArray = (currentComponents?: Record<string, any>) => {
    if (!currentComponents) {
      currentComponents = state.currentComponents;
    }

    const components = [];
    const componentsData = customizationStore.getComponentsData();
    for (const [category, data] of Object.entries(currentComponents)) {
      if (data.style > -1 && componentsData[category]) {
        const component = componentsData[category][data.style]?.components[data.option];
        if (component) {
          components.push(component.component);
        }
      }
    }

    return components;
  };

  const setComponent = (componentType: string, style: number, option: number) => {
    console.log('component', componentType, style, option);
    customizationStore.setComponent(componentType, style, option);
  };

  const handleHighlightGender = (gender: 'male' | 'female', e: React.MouseEvent<HTMLDivElement>) => {
    customizationStore.highlightGender(gender);
  };

  const handleChooseGender = (e: React.MouseEvent<HTMLDivElement>) => {
    console.log('handleChooseGender');
    customizationStore.chooseGender();
  };

  const getComponentDataArray = () => {
    return customizationStore.getComponentDataArray();
  };

  const handleSetState = (newState: Customization.State) => {
    console.log('handleSetState', newState);
    customizationStore.setState(newState);
  };

  const handleChangeSkinTone = (value: number) => {
    console.log('handleChangeSkinTone', value);
    customizationStore.setSkinTone(value);
  };

  const handleChangeHead = (value: number) => {
    console.log('handleChangeHead', value);
    customizationStore.setHead(value);
  };

  const handleChangeTeeth = (value: number) => {
    console.log('handleChangeTeeth', value);
    customizationStore.setTeeth(value);
  };

  const handleChangeBodyType = (value: number) => {
    console.log('handleChangeBodyType', value);
    customizationStore.setBodyType(value);
  };

  const handleChangeWaist = (value: number) => {
    console.log('handleChangeWasit', value);
    customizationStore.changeWaist(value);
  };

  const handleChangeFaceFeature = (feature: number, value: number) => {
    console.log('handleChangeFaceFeature', feature, value);
    customizationStore.setFaceFeature(feature, value);
  };

  const updateFirstName = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('updateFirstName', e.target.value);
    customizationStore.setFirstName(e.target.value);
  };

  const updateLastName = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('updateLastName', e.target.value);
    customizationStore.setLastName(e.target.value);
  };

  const updateDateOfBirth = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('updateDateOfBirth', e.target.value);
    customizationStore.setDateOfBirth(e.target.value);
  };

  const handleFaceChange = (option: string, value: number, option2?: string, value2?: number) => {
    console.log('handleFaceChange', option, value, option2, value2);
    customizationStore.handleFaceChange(option, value, option2, value2);
  };

  const handleRotation = (value: number) => {
    console.log('handleRotation', value);
    customizationStore.handleRotation(value);
  };

  const changeLayers = (layers: UI.Customization.LayerData[]) => {
    console.log('changeLayers', layers);
    customizationStore.setCurrentLayers(layers);
  };

  return (
    <>
      {state.show && state.state === 'gender' && (
        <>
          <div
            className={
              state.gender === 'male'
                ? `${componentStyles.genderSelect} ${componentStyles.active}`
                : componentStyles.genderSelect
            }
            style={{ left: 0 }}
            onMouseEnter={(e) => handleHighlightGender('male', e)}
            onMouseDown={handleChooseGender}
          />
          <div
            className={
              state.gender === 'female'
                ? `${componentStyles.genderSelect} ${componentStyles.active}`
                : componentStyles.genderSelect
            }
            style={{ right: 0 }}
            onMouseEnter={(e) => handleHighlightGender('female', e)}
            onMouseDown={handleChooseGender}
          />
        </>
      )}
      {state.show && state.state !== 'gender' && state.state !== 'transition' && (
        <>
          <div className={styles.modalRight}>
            {state.state === 'info' && (
              <>
                <div className={styles.modalContents}>
                  <input type="text" placeholder="First Name" onChange={updateFirstName} value={state.firstName} />
                  <input type="text" placeholder="Last Name" onChange={updateLastName} value={state.lastName} />
                  <input type="date" onChange={updateDateOfBirth} value={state.dateOfBirth} />
                  <XYSlider
                    label="Test XY Grid"
                    xMin={-1}
                    xMax={1}
                    yMin={-1}
                    yMax={1}
                    step={0.1}
                    onChange={(xValue, yValue) => console.log('onChange', xValue, yValue)}
                  />
                </div>
              </>
            )}
            {state.state === 'head' && (
              <>
                <div className={styles.modalContents}>
                  <OverlaySelector
                    onChange={changeLayers}
                    overlays={customizationStore.getOverlaysData()}
                    layers={state.currentLayers}
                  />
                  <RangeSlider
                    label="Head"
                    min={0}
                    max={19}
                    defaultValue={state.head}
                    resetTo={0}
                    onChange={handleChangeHead}
                    debounce={250}
                  />
                  <RangeSlider
                    label="Teeth"
                    labels={teethTypes}
                    min={0}
                    max={6}
                    defaultValue={state.teeth}
                    resetTo={0}
                    onChange={handleChangeTeeth}
                  />

                  <StyleColorSelector
                    label="hair"
                    onChange={(style, option) => setComponent('hair', style, option)}
                    components={(customizationStore.getComponentsData()['hair'] || []).map((item) => ({
                      name: item.name,
                      components: item.components.map((comp) => ({
                        name: comp.name || '',
                        type: comp.type,
                        component: comp.component,
                      })),
                    }))}
                    style={state.currentComponents['hair']?.style || -1}
                    option={state.currentComponents['hair']?.option || 0}
                    gender={state.gender}
                  />

                  {faceFeatures.map((feature) => (
                    <RangeSlider
                      key={feature.id}
                      label={feature.label}
                      min={feature.min}
                      max={feature.max}
                      step={0.1}
                      defaultValue={state.currentFaceFeatures[`${feature.id}`] || 0}
                      resetTo={0}
                      onChange={(value) => handleChangeFaceFeature(feature.id, value)}
                      debounce={0}
                    />
                  ))}
                </div>
              </>
            )}
            {state.state === 'body' && (
              <>
                <div className={styles.modalContents}>
                  <RangeSlider
                    label="Skin Tone"
                    min={0}
                    max={5}
                    defaultValue={state.skinTone}
                    resetTo={0}
                    onChange={handleChangeSkinTone}
                    debounce={250}
                  />
                  <RangeSlider
                    label="Body Type"
                    labels={bodyTypes}
                    defaultValue={state.bodyType}
                    resetTo={0}
                    max={4}
                    onChange={handleChangeBodyType}
                    debounce={25}
                  />
                  <RangeSlider
                    label="Bodyweight"
                    min={-10}
                    max={10}
                    step={0.1}
                    defaultValue={state.currentFaceFeatures['2007'] || 0}
                    resetTo={0}
                    onChange={(value) => handleChangeFaceFeature(2007, value)}
                    debounce={0}
                  />
                  <RangeSlider
                    label="Muscles"
                    min={-2.5}
                    max={2.5}
                    step={0.1}
                    defaultValue={state.currentFaceFeatures['65374'] || 0}
                    resetTo={0}
                    onChange={(value) => handleChangeFaceFeature(65374, value)}
                    debounce={0}
                  />
                  <RangeSlider
                    label="Anterior Trapezius"
                    min={-1}
                    max={1}
                    step={0.1}
                    defaultValue={state.currentFaceFeatures['33485'] || 0}
                    resetTo={0}
                    onChange={(value) => handleChangeFaceFeature(33485, value)}
                    debounce={0}
                  />

                  {state.gender === 'female' && (
                    <>
                      <RangeSlider
                        label="Chest Height"
                        min={-1.5}
                        max={2.5}
                        step={0.1}
                        defaultValue={state.currentFaceFeatures[46240] || 0}
                        resetTo={0}
                        onChange={(value) => handleChangeFaceFeature(46240, value)}
                        debounce={0}
                      />
                      <RangeSlider
                        label="Butt/Hip Size"
                        min={-1}
                        max={2.5}
                        step={0.1}
                        defaultValue={state.currentFaceFeatures[8991] || 0}
                        resetTo={0}
                        onChange={(value) => handleChangeFaceFeature(8991, value)}
                        debounce={0}
                      />
                    </>
                  )}
                </div>
              </>
            )}
            {state.state === 'clothing' && (
              <>
                <div className={styles.modalContents}>
                  {pedComponentCategories.map((category) => (
                    <StyleColorSelector
                      key={category}
                      label={category}
                      onChange={(style, option) => setComponent(category, style, option)}
                      components={(customizationStore.getComponentsData()[category] || []).map((item) => ({
                        name: item.name,
                        components: item.components.map((comp) => ({
                          name: comp.name || '',
                          type: comp.type,
                          component: comp.component,
                        })),
                      }))}
                      style={state.currentComponents[category]?.style || -1}
                      option={state.currentComponents[category]?.option || 0}
                      gender={state.gender}
                    />
                  ))}
                </div>
              </>
            )}
            <div className={styles.modalButtons}>
              <button className={styles.modalButton} onClick={() => handleSetState('gender')}>
                <VenusMars />
              </button>
              <button
                className={state.state === 'info' ? `${styles.modalButton} ${styles.active}` : styles.modalButton}
                onClick={() => handleSetState('info')}
              >
                <InfoSquare />
              </button>
              <button
                className={state.state === 'body' ? `${styles.modalButton} ${styles.active}` : styles.modalButton}
                onClick={() => handleSetState('body')}
              >
                <Child />
              </button>
              <button
                className={state.state === 'head' ? `${styles.modalButton} ${styles.active}` : styles.modalButton}
                onClick={() => handleSetState('head')}
              >
                <HeadSide />
              </button>
              <button
                className={state.state === 'clothing' ? `${styles.modalButton} ${styles.active}` : styles.modalButton}
                onClick={() => handleSetState('clothing')}
              >
                <Tshirt />
              </button>
              <button className={styles.modalButton} onClick={() => handleSetState('finalize')}>
                <Save />
              </button>
            </div>
          </div>
          <div className={styles.bottomControls}>
            <RangeSlider
              min={-90}
              max={270}
              step={45}
              labelsAlt={['-180°', '-135°', '-90°', '-45°', '0°', '45°', '90°', '135°', '180°']}
              defaultValue={90}
              onChange={handleRotation}
              className="rotation"
            />
          </div>
        </>
      )}
      {state.show && false && (
        <>
          <div className={styles.modalLeft}>
            <div className={styles.modalContents}>
              <TintSelector
                label="Head"
                onChange={setTintByCategory}
                identifier="hand"
                palette={state.tints.hand.palette}
                tint0={state.tints.hand.tint0}
                tint1={state.tints.hand.tint1}
                tint2={state.tints.hand.tint2}
              />
              {/*<TintSelector*/}
              {/*  label="Coat Tint"*/}
              {/*  onChange={setTintByCategory}*/}
              {/*  identifier="coats"*/}
              {/*  palette={state.tints.coats.palette}*/}
              {/*  tint0={state.tints.coats.tint0}*/}
              {/*  tint1={state.tints.coats.tint1}*/}
              {/*  tint2={state.tints.coats.tint2}*/}
              {/*/>*/}
            </div>
          </div>
        </>
      )}
    </>
  );
}

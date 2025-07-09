import { debounce } from 'lodash';

import { Socket } from 'socket.io-client';

import UIComponent from '@uiLib/ui-component';
import { emitClient, LoadResourceJson, onClient } from '@lib/ui';

import { ModalButton, ModalButtons, ModalContents, ModalLeft, ModalRight, BottomControls, ModalTitle } from './styled';
import StyleColorSelector from './components/StyleColorSelector';
import { GenderSelect } from './components/Gender';
import TintSelector from './components/TintSelector';
import XYSlider from './components/XYSlider';
import RangeSlider from './components/RangeSlider';

import VenusMars from '@styled/fa5/duotone/venus-mars.svg';
import InfoSquare from '@styled/fa5/duotone/info-square.svg';
import Tshirt from '@styled/fa5/duotone/tshirt.svg';
import Child from '@styled/fa5/duotone/child.svg';
import Save from '@styled/fa5/duotone/save.svg';
import HeadSide from '@styled/fa5/duotone/head-side.svg';
import OverlaySelector from './components/OverlaySelector';

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

const ComponentsData: Record<string, UI.Customization.ComponentJson[]> = {};
const OverlaysData: Record<string, UI.Customization.OverlayJson> = {};

const pedComponentCategories = [
  'hats',
  'eyewear',
  'neckties',
  'neckwear',

  'shirts_full',
  'suspenders',
  'vests',
  'coats',
  'coats_closed',
  'cloaks',
  'ponchos',

  'gauntlets',
  'gloves',

  'belts',
  'belt_buckles',
  'gunbelts',
  'skirts',
  'pants',
  'boots',
  'boot_accessories',
  'spats',
  'chaps',

  'accessories',
  'jewelry_bracelets',
  'jewelry_rings_left',
  'jewelry_rings_right',
];

const bodyTypes = ['Athletic', 'Skinny', 'Average', 'Brawny', 'Heavy'];
const teethTypes = [
  'The Chompers',
  'The Gilded',
  'Plumb Wore Out',
  'The Hayseed',
  'The Long-Dead',
  'The Gummer',
  'The Yokel',
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

export default class Customization extends UIComponent<UI.Customization.Props, UI.Customization.State, {}> {
  constructor(
    props: UI.Customization.Props,
    context: { socket: Socket<UISocketEvents, SocketServer.Client & SocketServer.ClientEvents> },
  ) {
    super();

    this.state = {
      show: false,
      state: 'gender',
      components: {},
      model: '',
      gender: 'male',
      currentComponents: {},
      hiddenComponents: {},
      currentFaceOptions: {},
      currentFaceFeatures: {},
      currentBodyOptions: {},
      currentLayers: [],
      currentWhistle: {},
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      tints: {},
      head: 0,
      teeth: 0,
      skinTone: 0,
      bodyType: 2,
    };

    onClient('customization.state', (state) => {
      this.setState(state);
    });

    onClient('customization.set-tint-by-category', (category, tint) => {
      this.setState({ tints: { ...this.state.tints, [category]: tint } });
    });

    this.resetComponents();
    this.loadComponents();
  }

  async resetComponents() {
    const tints: Record<string, CustomizationPalette> = {};
    const currentComponents: Record<string, any> = {};

    for (const category of [...pedComponentCategories, ...horseComponentCategories]) {
      tints[category] = {
        palette: -1,
        tint0: 0,
        tint1: 0,
        tint2: 0,
      };

      currentComponents[category] = {
        style: -1,
        option: 0,
      };
    }

    this.setState({ tints, currentComponents });
  }

  async loadComponents() {
    for (const componentFile of componentFiles) {
      ComponentsData[componentFile] = (await LoadResourceJson(
        'rdr3-shared',
        `components-ui/${componentFile}.json`,
      )) as UI.Customization.ComponentJson[];
    }

    const overlays = (await LoadResourceJson('rdr3-shared', 'resources/overlays.json')) as Record<
      string,
      UI.Customization.OverlayJson
    >;

    console.log('overlays', overlays);

    for (const [category, overlayData] of Object.entries(overlays)) {
      OverlaysData[category] = overlayData;
    }
  }

  onEvent(event: UI.Customization.Event) {
    console.log('setState', event);
    this.setState(event);
    if (!event.show) {
      this.resetComponents();
    }
  }

  sendClientData = debounce((updateCategory: string) => {
    for (const [category, data] of Object.entries(this.state.tints)) {
      if (category !== updateCategory) continue;
      if (data.palette === 0) {
        emitClient('customization.set-tint-by-category', category, {
          palette: -1,
          tint0: 0,
          tint1: 0,
          tint2: 0,
        });
      } else {
        emitClient('customization.set-tint-by-category', category, data);
      }
    }
  }, 1000);

  setTintByCategory(category: string, tint: Customization.Palette) {
    this.setState({ tints: { ...this.state.tints, [category]: tint } });
    this.sendClientData(category);
  }

  getComponentArray(currentComponents?: Record<string, any>) {
    if (!currentComponents) {
      currentComponents = this.state.currentComponents;
    }

    const components = [];
    for (const [category, data] of Object.entries(currentComponents)) {
      if (data.style > -1) {
        const component = ComponentsData[category][data.style].components[data.option];
        components.push(component.component);
      }
    }

    return components;
  }

  setComponent(componentType: string, style: number, option: number) {
    console.log('component', componentType, style, option);
    const currentComponents = { ...this.state.currentComponents, [componentType]: { style, option } };
    this.setState({ currentComponents });

    const components = this.getComponentArray(currentComponents);

    console.log('customization.set-components', components);
    console.log('this.getComponentDataArray()', this.getComponentDataArray());
    emitClient('customization.set-components', components);
  }

  handleHighlightGender(gender: 'male' | 'female', e: MouseEvent) {
    this.setState({ gender });
    emitClient('customization.highlight', gender);
  }

  handleChooseGender(e: MouseEvent) {
    console.log('handleChooseGender');
    emitClient('customization.choose-gender');
  }

  getComponentDataArray() {
    const comp = {
      name: 'Paisley Vest',
      tint0: 16,
      tint1: 21,
      tint2: 20,
      palette: 'metaped_tint_generic',
      category: 'VESTS',
      shopItem: 'CLOTHING_ITEM_M_VEST_000_TINT_001',
    };

    const currentComponents = this.state.currentComponents;

    const components: Record<string, any> = {};
    for (const [category, data] of Object.entries(currentComponents)) {
      if (data.style > -1) {
        const component = ComponentsData[category][data.style].components[data.option];
        let name = component.friendlyName || component.name || component.category;

        if (typeof name === 'string') {
          name = name.replace(/^CLOTHING_ITEM_[A-Z]{1,2}_/, '');
          name = name.replace(/_[0-9]{3}_TINT_[0-9]{3}$/, '');
          name.replace(/_/g, ' ');
          name = name
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        }

        components[category] = {
          name,
          // tint0: comp.tint0,
          // tint1: comp.tint1,
          // tint2: comp.tint2,
          // palette: comp.palette,
          category: category.toUpperCase(),
          shopItem: component.name || component.component,
        };
      }
    }

    return components;
  }

  handleSetState(state: Customization.State) {
    console.log('handleSetState', state);
    if (state === 'finalize') {
      console.log(this.state);
      console.log(this.props.socket.emit);
      const state = { ...this.state, currentComponents: this.getComponentDataArray(), tints: {}, currentLayers: [] };
      // TODO: Send current body/head components and face features
      console.log(JSON.stringify(state, null, 2));
      this.props.socket.emit('customization.finalize', JSON.stringify(state));
    } else {
      emitClient('customization.set-state', state);
    }
  }

  handleChangeSkinTone(value: number) {
    console.log('handleChangeSkinTone', value);
    this.setState({ skinTone: value });
    emitClient('customization.set-skin-tone', value);
    emitClient('customization.set-layers', this.state.currentLayers);
  }

  handleChangeHead(value: number) {
    console.log('handleChangeHead', value);
    this.setState({ head: value });
    emitClient('customization.set-head', value);
  }

  handleChangeTeeth(value: number) {
    console.log('handleChangeTeeth', value);
    this.setState({ teeth: value });
    emitClient('customization.set-teeth', value);
  }

  handleChangeBodyType(value: number) {
    console.log('handleChangeBodyType', value);
    this.setState({ bodyType: value });
    emitClient('customization.set-body-type', value);
  }

  handleChangeWaist(value: number) {
    console.log('handleChangeWasit', value);
    emitClient('customization.set-waist', value);
  }

  handleChangeFaceFeature(feature: number, value: number) {
    console.log('handleChangeFaceFeature', feature, value);
    emitClient('customization.set-face-feature', feature, value);
    this.setState((prevState) => ({
      currentFaceFeatures: { ...prevState.currentFaceFeatures, [`${feature}`]: value },
    }));
  }

  updateFirstName(target: HTMLInputElement) {
    console.log('updateFirstName', target.value);
    this.setState({ firstName: target.value });
  }

  updateLastName(target: HTMLInputElement) {
    console.log('updateLastName', target.value);
    this.setState({ lastName: target.value });
  }

  updateDateOfBirth(target: HTMLInputElement) {
    console.log('updateDateOfBirth', target.value);
    this.setState({ dateOfBirth: target.value });
  }

  handleFaceChange(option: string, value: number, option2?: string, value2?: number) {
    console.log('handleFaceChange', option, value, option2, value2);
    this.setState((prevState) => {
      const currentFaceOptions = { ...prevState.currentFaceOptions, [option]: value };
      if (option2 && value2 !== undefined) {
        currentFaceOptions[option2] = value2;
      }
      emitClient('customization.set-face-option', currentFaceOptions);
      return { currentFaceOptions };
    });
  }

  handleRotation(value: number) {
    console.log('handleRotation', value);
    emitClient('customization.rotate-chosen', value);
  }

  changeLayers(layers: UI.Customization.LayerData[]) {
    console.log('changeLayers', layers);
    this.setState({ currentLayers: layers });
    emitClient('customization.set-layers', layers);
  }

  render() {
    return (
      <>
        {this.state.show && this.state.state === 'gender' && (
          <>
            <GenderSelect
              className={this.state.gender === 'male' ? 'active' : ''}
              style={{ left: 0 }}
              onMouseEnter={this.handleHighlightGender.bind(this, 'male')}
              onMouseDown={this.handleChooseGender.bind(this)}
            />
            <GenderSelect
              className={this.state.gender === 'female' ? 'active' : ''}
              style={{ right: 0 }}
              onMouseEnter={this.handleHighlightGender.bind(this, 'female')}
              onMouseDown={this.handleChooseGender.bind(this)}
            />
          </>
        )}
        {this.state.show && this.state.state !== 'gender' && this.state.state !== 'transition' && (
          <>
            <ModalRight>
              {this.state.state === 'info' && (
                <>
                  <ModalContents>
                    <input
                      type="text"
                      placeholder="First Name"
                      onChange={(e) => this.updateFirstName(e.target as HTMLInputElement)}
                      value={this.state.firstName}
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      onChange={(e) => this.updateLastName(e.target as HTMLInputElement)}
                      value={this.state.lastName}
                    />
                    <input
                      type="date"
                      onChange={(e) => this.updateDateOfBirth(e.target as HTMLInputElement)}
                      value={this.state.dateOfBirth}
                    />
                    <XYSlider
                      label="Test XY Grid"
                      xMin={-1}
                      xMax={1}
                      yMin={-1}
                      yMax={1}
                      step={0.1}
                      onChange={(xValue, yValue) => console.log('onChange', xValue, yValue)}
                    />
                    {/*<TintSelector*/}
                    {/*  label="Hat Tint"*/}
                    {/*  onChange={this.setTintByCategory.bind(this)}*/}
                    {/*  identifier="hats"*/}
                    {/*  palette={this.state.tints.hats.palette}*/}
                    {/*  tint0={this.state.tints.hats.tint0}*/}
                    {/*  tint1={this.state.tints.hats.tint1}*/}
                    {/*  tint2={this.state.tints.hats.tint2}*/}
                    {/*/>*/}
                  </ModalContents>
                </>
              )}
              {this.state.state === 'head' && (
                <>
                  <ModalContents>
                    <OverlaySelector
                      onChange={this.changeLayers.bind(this)}
                      overlays={OverlaysData}
                      layers={this.state.currentLayers}
                    />
                    <RangeSlider
                      label="Head"
                      min={0}
                      max={19}
                      defaultValue={this.state.head}
                      resetTo={0}
                      onChange={this.handleChangeHead.bind(this)}
                    />
                    <RangeSlider
                      label="Teeth"
                      labels={teethTypes}
                      min={0}
                      max={6}
                      defaultValue={this.state.teeth}
                      resetTo={0}
                      onChange={this.handleChangeTeeth.bind(this)}
                    />

                    <StyleColorSelector
                      label="hair"
                      onChange={(style, option) => this.setComponent('hair', style, option)}
                      components={ComponentsData['hair']}
                      style={this.state.currentComponents['hair']?.style || -1}
                      option={this.state.currentComponents['hair']?.option || 0}
                      gender={this.state.gender}
                    />

                    {/*<RangeSlider*/}
                    {/*  label="Head Width"*/}
                    {/*  min={-2}*/}
                    {/*  max={3}*/}
                    {/*  step={0.1}*/}
                    {/*  onChange={this.handleFaceChange.bind(this, 'headWidth')}*/}
                    {/*  className="head-width"*/}
                    {/*/>*/}
                    {/*<XYSlider*/}
                    {/*  label="Cheek Bone"*/}
                    {/*  xMin={-4}*/}
                    {/*  xMax={3.5}*/}
                    {/*  yMin={-2.5}*/}
                    {/*  yMax={2.5}*/}
                    {/*  step={0.1}*/}
                    {/*  onChange={(xValue, yValue) =>*/}
                    {/*    this.handleFaceChange('cheekBoneWidth', xValue, 'cheekBoneHeight', yValue)*/}
                    {/*  }*/}
                    {/*  className="cheek-bone"*/}
                    {/*/>*/}
                    {/*<RangeSlider*/}
                    {/*  label="Cheek Depth"*/}
                    {/*  min={-2.5}*/}
                    {/*  max={2.5}*/}
                    {/*  step={0.1}*/}
                    {/*  onChange={this.handleFaceChange.bind(this, 'cheekBoneDepth')}*/}
                    {/*  className="cheek-depth"*/}
                    {/*  vertical={true}*/}
                    {/*/>*/}

                    {faceFeatures.map((feature) => (
                      <RangeSlider
                        key={feature.id}
                        label={feature.label}
                        min={feature.min}
                        max={feature.max}
                        step={0.1}
                        defaultValue={this.state.currentFaceFeatures[`${feature.id}`] || 0}
                        resetTo={0}
                        onChange={this.handleChangeFaceFeature.bind(this, feature.id)}
                      />
                    ))}
                  </ModalContents>
                </>
              )}
              {this.state.state === 'body' && (
                <>
                  <ModalContents>
                    <RangeSlider
                      label="Skin Tone"
                      min={0}
                      max={5}
                      defaultValue={this.state.skinTone}
                      resetTo={0}
                      onChange={this.handleChangeSkinTone.bind(this)}
                    />
                    {/*<RangeSlider label="Eyes" min={0} max={1} onChange={this.handleChangeEyes.bind(this)} />*/}
                    <RangeSlider
                      label="Body Type"
                      labels={bodyTypes}
                      defaultValue={this.state.bodyType}
                      resetTo={0}
                      max={4}
                      onChange={this.handleChangeBodyType.bind(this)}
                    />
                    {/*<RangeSlider label="Waist" max={20} onChange={this.handleChangeWaist.bind(this)} />*/}
                    <RangeSlider
                      label="Bodyweight"
                      min={-10}
                      max={10}
                      step={0.1}
                      defaultValue={this.state.currentFaceFeatures['2007'] || 0}
                      resetTo={0}
                      onChange={this.handleChangeFaceFeature.bind(this, 2007)}
                    />
                    <RangeSlider
                      label="Muscles"
                      min={-2.5}
                      max={2.5}
                      step={0.1}
                      defaultValue={this.state.currentFaceFeatures['65374'] || 0}
                      resetTo={0}
                      onChange={this.handleChangeFaceFeature.bind(this, 65374)}
                    />
                    <RangeSlider
                      label="Anterior Trapezius"
                      min={-1}
                      max={1}
                      step={0.1}
                      defaultValue={this.state.currentFaceFeatures['33485'] || 0}
                      resetTo={0}
                      onChange={this.handleChangeFaceFeature.bind(this, 33485)}
                    />

                    {this.state.gender === 'female' && (
                      <>
                        <RangeSlider
                          label="Chest Height"
                          min={-1.5}
                          max={2.5}
                          step={0.1}
                          defaultValue={this.state.currentFaceFeatures[46240] || 0}
                          resetTo={0}
                          onChange={this.handleChangeFaceFeature.bind(this, 46240)}
                        />
                        <RangeSlider
                          label="Butt/Hip Size"
                          min={-1}
                          max={2.5}
                          step={0.1}
                          defaultValue={this.state.currentFaceFeatures[8991] || 0}
                          resetTo={0}
                          onChange={this.handleChangeFaceFeature.bind(this, 8991)}
                        />
                      </>
                    )}
                  </ModalContents>
                </>
              )}
              {this.state.state === 'clothing' && (
                <>
                  <ModalContents>
                    {pedComponentCategories.map((category) => (
                      <StyleColorSelector
                        label={category}
                        onChange={(style, option) => this.setComponent(category, style, option)}
                        components={ComponentsData[category]}
                        style={this.state.currentComponents[category]?.style || -1}
                        option={this.state.currentComponents[category]?.option || 0}
                        gender={this.state.gender}
                      />
                    ))}
                  </ModalContents>
                </>
              )}
              <ModalButtons>
                <ModalButton onClick={this.handleSetState.bind(this, 'gender')}>
                  <VenusMars />
                </ModalButton>
                <ModalButton
                  className={this.state.state === 'info' ? 'active' : ''}
                  onClick={this.handleSetState.bind(this, 'info')}
                >
                  <InfoSquare />
                </ModalButton>
                <ModalButton
                  className={this.state.state === 'body' ? 'active' : ''}
                  onClick={this.handleSetState.bind(this, 'body')}
                >
                  <Child />
                </ModalButton>
                <ModalButton
                  className={this.state.state === 'head' ? 'active' : ''}
                  onClick={this.handleSetState.bind(this, 'head')}
                >
                  <HeadSide />
                </ModalButton>
                <ModalButton
                  className={this.state.state === 'clothing' ? 'active' : ''}
                  onClick={this.handleSetState.bind(this, 'clothing')}
                >
                  <Tshirt />
                </ModalButton>
                <ModalButton onClick={this.handleSetState.bind(this, 'finalize')}>
                  <Save />
                </ModalButton>
              </ModalButtons>
            </ModalRight>
            <BottomControls>
              <RangeSlider
                min={-90}
                max={270}
                step={45}
                labelsAlt={['-180°', '-135°', '-90°', '-45°', '0°', '45°', '90°', '135°', '180°']}
                defaultValue={90}
                onChange={this.handleRotation.bind(this)}
                className="rotation"
              />
            </BottomControls>
          </>
        )}
        {this.state.show && false && (
          <>
            <ModalLeft>
              <ModalContents>
                <TintSelector
                  label="Hat Tint"
                  onChange={this.setTintByCategory.bind(this)}
                  identifier="hats"
                  palette={this.state.tints.hats.palette}
                  tint0={this.state.tints.hats.tint0}
                  tint1={this.state.tints.hats.tint1}
                  tint2={this.state.tints.hats.tint2}
                />
                <TintSelector
                  label="Coat Tint"
                  onChange={this.setTintByCategory.bind(this)}
                  identifier="coats"
                  palette={this.state.tints.coats.palette}
                  tint0={this.state.tints.coats.tint0}
                  tint1={this.state.tints.coats.tint1}
                  tint2={this.state.tints.coats.tint2}
                />
              </ModalContents>
            </ModalLeft>
          </>
        )}
      </>
    );
  }
}

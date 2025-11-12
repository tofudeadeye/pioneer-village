import { Component, createRef } from 'react';

import { uiSize } from '@uiLib/helpers';

import styles from './styles.module.scss';

interface Props {
  label: string;
  onChange: (style: number, option: number) => void;
  components: { name: string; components: UI.Customization.StyleColorComponentData[] }[];
  gender: 'male' | 'female';
  style?: number;
  option?: number;
}

interface State {
  active: boolean;
  currentStyle: number;
  currentOption: number;
  erroredImages: Set<number>;
}

const itsThumbScale = 1;
const renderTint = (palette: string | number, tint0: number, tint1: number, tint2: number): React.ReactNode => {
  // const tints = [tint0, tint0, tint0, tint0, tint1, tint1, tint2];
  const tints = [tint0, tint1, tint2];

  return (
    <div className={styles.itsThumbs}>
      {tints.map((tint, i) => (
        <div
          className={styles.itsThumb}
          key={i}
          style={{
            backgroundImage: `url(https://p--v.b-cdn.net/customization/palettes/${palette}_thumbs.png)`,
            backgroundPosition: `-${uiSize((tint % 8) * 8 * itsThumbScale)} -${uiSize(
              Math.floor(tint / 8) * 8 * itsThumbScale,
            )}`,
          }}
        />
      ))}
    </div>
  );
};

export default class StyleColorSelector extends Component<Props, State> {
  refContent = createRef<HTMLDivElement>();

  constructor(props: Props) {
    super(props);

    this.state = {
      active: false,
      currentStyle: props.style || -1,
      currentOption: props.option || 0,
      erroredImages: new Set(),
    };
  }

  decrement() {
    const newStyle = Math.max(this.state.currentStyle - 1, -1);
    if (newStyle === this.state.currentStyle) {
      return;
    }
    this.setState({ currentStyle: newStyle, currentOption: 0 });
    this.props.onChange(newStyle, 0);
  }

  increment() {
    const newStyle = Math.min(this.state.currentStyle + 1, this.props.components.length - 1);
    if (newStyle === this.state.currentStyle) {
      return;
    }
    this.setState({ currentStyle: newStyle, currentOption: 0 });
    this.props.onChange(newStyle, 0);
  }

  optionError(component: number) {
    const erroredImages = this.state.erroredImages;
    erroredImages.add(component);
    this.setState({ erroredImages });
  }

  toggleContent() {
    // const contentHeight = this.refContent?.current?.scrollHeight || 'auto';
    this.setState({ active: !this.state.active });
  }

  render() {
    return (
      <div className={styles.scsContainer}>
        <div className={styles.scsTitle} onClick={this.toggleContent.bind(this)}>
          {this.props.label}
        </div>
        <div
          ref={this.refContent}
          className={this.state.active ? `${styles.scsContent} ${styles.active}` : styles.scsContent}
        >
          <div className={styles.scsContentWrapper}>
            <div className={styles.scsSelector}>
              <div
                style={{ cursor: 'pointer', fontSize: uiSize(48), paddingRight: uiSize(8) }}
                onClick={this.decrement.bind(this)}
              >
                &lt;
              </div>
              <p>
                {this.state.currentStyle === -1
                  ? 'None'
                  : (this.props.components[this.state.currentStyle]?.name ?? 'Misc')}
                <br />
                {this.state.currentStyle + 1} of {this.props.components.length}
              </p>
              <div
                style={{ cursor: 'pointer', fontSize: uiSize(48), paddingRight: uiSize(8) }}
                onClick={this.increment.bind(this)}
              >
                &gt;
              </div>
            </div>
            <div className={styles.scsOptions}>
              {this.props.components[this.state.currentStyle]?.components.map((component, index) => {
                if (this.props.label === 'hair' && !component.name?.includes('BLACK')) {
                  return;
                }
                if (
                  (this.props.gender === 'male' && component.type === '1') ||
                  (this.props.gender === 'female' && component.type === '0')
                ) {
                  return null;
                }
                return (
                  <div
                    key={index}
                    className={`${styles.scsOption} ${index === this.state.currentOption ? styles.selected : ''}`}
                    onClick={() => {
                      this.setState({ currentOption: index });
                      this.props.onChange(this.state.currentStyle, index);
                    }}
                  >
                    {'palette' in component && typeof component.palette === 'string' ? (
                      renderTint(component.palette, component.tint0, component.tint1, component.tint2)
                    ) : (
                      <span className={index === this.state.currentOption ? styles.selected : ''}>{index + 1}</span>
                    )}
                    {/*{this.state.erroredImages.has(component.component) ? (*/}
                    {/*  <span className={index === this.state.currentOption ? styles.selected : ''}>{index + 1}</span>*/}
                    {/*) : (*/}
                    {/*  <img*/}
                    {/*    className={index === this.state.currentOption ? styles.selected : ''}*/}
                    {/*    src={`https://p--v.b-cdn.net/swatches/components/${component.component}.png`}*/}
                    {/*    onError={() => this.optionError(component.component)}*/}
                    {/*  />*/}
                    {/*)}*/}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

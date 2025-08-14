import { Component, MouseEvent as ReactMouseEvent } from 'react';

import styles from './styles.module.scss';

type Props = {
  label?: string;
  labels?: string[];
  labelsAlt?: string[];
  defaultValue?: number;
  resetTo?: number;
  min?: number;
  max: number;
  step?: number;
  className?: string;
  vertical?: boolean;
  onChange: (value: number) => void;
};

interface State {
  isDragging: boolean;
  active: boolean;
  value: number;
}

export default class RangeSlider extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isDragging: false,
      active: false,
      value: props.defaultValue || 0,
    };
  }

  updateValue(e: React.ChangeEvent<HTMLInputElement>) {
    const value = Number(e.target.value);
    this.setState({ value });
    this.props.onChange(value);
  }

  onMouseDown = (e: ReactMouseEvent<HTMLInputElement>) => {
    if (e.button === 2) {
      const value = this.props.resetTo ?? this.props.defaultValue ?? 0;
      console.log('value', value);
      this.setState({ value });
      this.props.onChange(value);
      return;
    }
    if (e.button !== 0) return;
  };

  render() {
    const classNames = [
      styles.rContainer,
      this.props.className ? styles[this.props.className.replace(/-/g, '')] : '',
      this.props.vertical ? styles.vertical : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={classNames}>
        {(this.props.label || this.props.labels) && (
          <div className={styles.rTitle}>
            {this.props.label}
            {this.props.labels && `: ${this.props.labels[this.state.value]}`}
          </div>
        )}
        <input
          type="range"
          onChange={this.updateValue.bind(this)}
          value={this.state.value}
          min={this.props.min || 0}
          max={this.props.max}
          step={this.props.step || 1}
          onMouseDown={this.onMouseDown.bind(this)}
        />
        {this.props.labelsAlt && (
          <div className={styles.markers}>
            {this.props.labelsAlt.map((label, index) => (
              <span key={index}>{label}</span>
            ))}
          </div>
        )}
      </div>
    );
  }
}

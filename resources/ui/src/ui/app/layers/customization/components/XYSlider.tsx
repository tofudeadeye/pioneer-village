import { clamp } from 'lodash';
import { Component, MouseEvent as ReactMouseEvent, createRef } from 'react';

import styles from './styles.module.scss';

interface Props {
  xLabel: string;
  yLabel: string;
  onChange: (xValue: number, yValue: number) => void;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  step: number;
  xDefaultValue?: number;
  yDefaultValue?: number;
  className?: string;
}

interface State {
  isDragging: boolean;
  xValue: number;
  yValue: number;
}

const findCommonPrefix = (str1: string, str2: string) => {
  let i = 0;
  while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
    i++;
  }
  const common = str1.slice(0, i).trim();
  const diff1 = str1.slice(common.length).trim();
  const diff2 = str2.slice(common.length).trim();
  return [common, diff1, diff2];
};

export default class XYSlider extends Component<Props, State> {
  refContent = createRef<HTMLDivElement>();
  refGrid = createRef<HTMLDivElement>();

  mouseupBinding = this.onmouseup.bind(this);
  mousemoveBinding = this.onmousemove.bind(this);

  constructor(props: Props) {
    super(props);

    this.state = {
      isDragging: false,
      xValue: props.xDefaultValue || 0,
      yValue: props.yDefaultValue || 0,
    };
  }

  componentDidMount() {
    document.addEventListener('mouseup', this.mouseupBinding);
    document.addEventListener('mousemove', this.mousemoveBinding);
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.mouseupBinding);
    document.removeEventListener('mousemove', this.mousemoveBinding);
  }

  onmousedown(e: ReactMouseEvent<HTMLDivElement>) {
    if (e.button === 2) {
      console.log('Reset XYSlider to default values');
      this.setState({
        xValue: this.props.xDefaultValue || 0,
        yValue: this.props.yDefaultValue || 0,
      });
      this.props.onChange(this.props.xDefaultValue || 0, this.props.yDefaultValue || 0);
      return;
    }
    if (e.button !== 0) return;

    // const target = e.target as HTMLElement;
    this.setState({ isDragging: true });
    this.onmousemove(e, true);
  }

  onmousemove(e: MouseEvent | ReactMouseEvent<HTMLDivElement>, force = false) {
    if (!this.state.isDragging && !force) return;

    const grid = this.refGrid.current;

    if (!grid) return;

    const rect = grid.getBoundingClientRect();

    const xPos = (e.clientX - rect.left) / rect.width;
    const yPos = (e.clientY - rect.top) / rect.height;

    let xValue = xPos * (this.props.xMax - this.props.xMin) + this.props.xMin;
    let yValue = yPos * (this.props.yMax - this.props.yMin) + this.props.yMin;

    const step = this.props.step;
    xValue = Math.round(xValue / step) * step;
    yValue = Math.round(yValue / step) * step;

    xValue = clamp(xValue, Math.min(this.props.xMin, this.props.xMax), Math.max(this.props.xMin, this.props.xMax));
    yValue = clamp(yValue, Math.min(this.props.yMin, this.props.yMax), Math.max(this.props.yMin, this.props.yMax));

    if (this.state.xValue !== xValue || this.state.yValue !== yValue) {
      this.setState({ xValue, yValue });

      this.props.onChange(xValue, yValue);
    }
  }

  onmouseup(e: MouseEvent) {
    this.setState({ isDragging: false });
  }

  top() {
    let value = (this.state.yValue - this.props.yMin) / (this.props.yMax - this.props.yMin);

    if (value < 0) {
      value = 1 + value;
    }

    return `${value * 100}%`;
  }

  left() {
    let value = (this.state.xValue - this.props.xMin) / (this.props.xMax - this.props.xMin);

    if (value < 0) {
      value = 1 + value;
    }

    return `${value * 100}%`;
  }

  render() {
    const containerClass =
      this.props.className === 'cheek-bone' ? `${styles.xyContainer} ${styles.cheekBone}` : styles.xyContainer;

    const [label, xLabel, yLabel] = findCommonPrefix(this.props.xLabel, this.props.yLabel);

    return (
      <div className={containerClass}>
        <div className={styles.xyTitle}>{label}</div>
        <div className={styles.xTitle}>{xLabel}</div>
        <div className={styles.yTitle}>{yLabel}</div>
        <div ref={this.refContent} className={styles.xyContents}>
          <div ref={this.refGrid} className={styles.xyGrid} onMouseDown={this.onmousedown.bind(this)}>
            <div className={styles.xyKnob} style={{ top: this.top(), left: this.left() }} />
          </div>
        </div>
      </div>
    );
  }
}

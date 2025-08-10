import { PropsWithChildren } from 'react';
import styled, { CSSProperties } from 'styled-components';

import { HiddenActiveVisible } from '@styled/core';
import theme from '@styled/theme';

import { uiSize } from '@uiLib/helpers';

interface ProgressIconProps {
  width: number;
  height: number;
  color?: keyof UI.Theme['colors'];
  fill: number;
  style?: CSSProperties;
  iconStyle?: CSSProperties;
  className?: string | undefined;
}

const Icon = styled.div`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;

  svg {
    width: 100%;
    height: 100%;

    path {
      transition: clip-path ${theme.transitionSpeed.fast};
      clip-path: var(--clipPath);
    }
  }
`;

export default function ProgressIcon(props: PropsWithChildren<ProgressIconProps>) {
  return (
    <HiddenActiveVisible
      className={props.className}
      style={{ position: 'relative', width: uiSize(props.width), height: uiSize(props.height), ...props.style }}
    >
      <Icon style={{ color: '#333' }}>{props.children}</Icon>
      <Icon
        style={{
          color: props.color ? theme.colors[props.color].hex : null,
          ['--clipPath']: `polygon(0 ${100 - props.fill}%, 100% ${100 - props.fill}%, 100% 100%, 0 100%)`,
          ...props.iconStyle,
        }}
      >
        {props.children}
      </Icon>
    </HiddenActiveVisible>
  );
}

import { PropsWithChildren, useState } from 'react';

import styles from './Select.module.scss';

interface SelectProps {
  style?: 'normal' | 'chat';
  selected?: string;
  options: Record<string, UI.Channel>;
  onChange?: (option: string) => void;
}

const defaultProps: SelectProps = {
  style: 'normal',
  options: {},
};

export default function Select(props: PropsWithChildren<SelectProps>) {
  let { style, options, selected } = { ...defaultProps, ...props };

  const [isOpen, setIsOpen] = useState(false);

  if (!selected) {
    selected = Object.keys(options)[0];
  }
  const selectClass = style === 'chat' ? styles.chatSelect : styles.normalSelect;

  const chooseOption = (option: string) => {
    setIsOpen(false);
    selected = option;

    if (props.onChange) {
      props.onChange(option);
    }
  };

  return (
    <div className={selectClass}>
      <label className={styles.selectLabel} onClick={() => setIsOpen(!isOpen)}>
        {options[selected].label}
      </label>
      <ul className={isOpen ? 'active' : ''}>
        {Object.entries(options).map(([key, value]) => (
          <li key={key} onClick={() => chooseOption(key)}>
            {value.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

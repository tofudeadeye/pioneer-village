import { CSSProperties, PropsWithChildren } from 'react';

import styles from './Suggestions.module.scss';

interface SuggestionsProps {
  input: string;
  suggestions: UI.Chat.Suggestions;
  active?: boolean;
  style?: CSSProperties;
}

const defaultProps = {
  input: '',
  suggestions: [],
  active: false,
  style: {},
};

export default function Suggestions(props: PropsWithChildren<SuggestionsProps>) {
  const { input, suggestions, active, style } = { ...defaultProps, ...props };

  const inputs = input.split(' ');
  let matchingSuggestions = Object.keys(suggestions).filter((key) =>
    key.toLowerCase().startsWith(inputs[0].toLowerCase()),
  );

  let prefix = '';
  if (matchingSuggestions.length === 1 && (inputs.length > 1 || inputs[0] === matchingSuggestions[0])) {
    const suggestion = suggestions[matchingSuggestions[0]];
    if (suggestion.children) {
      prefix = matchingSuggestions[0];
      const remainingInput = inputs.slice(1).join(' ');
      matchingSuggestions = suggestion.children?.filter((key) =>
        key.toLowerCase().startsWith(remainingInput.toLowerCase()),
      );
    }
  }

  matchingSuggestions = matchingSuggestions.slice(0, 6);

  return (
    <ul style={style} className={`${styles.suggestionsContainer} ${active ? 'active' : ''}`}>
      {input &&
        matchingSuggestions.map((suggestion) => (
          <li key={suggestion}>
            {prefix} {suggestion} <span>{suggestions[suggestion]?.description}</span>
          </li>
        ))}
    </ul>
  );
}

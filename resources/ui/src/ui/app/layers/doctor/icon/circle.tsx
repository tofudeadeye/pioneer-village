import theme from '@styled/theme';

interface CircleProps {
  className?: string;
  width?: string;
  color?: keyof typeof theme.colors;
  percentage?: number;
}

export default function Circle(props: CircleProps) {
  return (
    <svg className={props.className} viewBox="0 0 106 106" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="53"
        cy="53"
        r="50"
        fill="none"
        strokeDasharray="314.159"
        stroke={theme.colors.gray50.hex}
        strokeWidth={props.width ?? '6px'}
        opacity="0.75"
        strokeDashoffset="0"
      />
      <circle
        cx="53"
        cy="53"
        r="50"
        fill="none"
        strokeDasharray="314.159"
        stroke={theme.colors[props.color ?? 'white'].hex}
        strokeWidth={props.width ?? '6px'}
        strokeDashoffset={`${2 * Math.PI * 50 * ((100 - (props.percentage ?? 100)) / 100)}px`}
      />
    </svg>
  );
}

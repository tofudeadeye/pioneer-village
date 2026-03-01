import Slider from './slider';

interface StringSliderProps {
  label: string;
  values: string[];
  value: number;
  onChange: (value: number) => void;
}

export default function StringSlider({ label, values, value, onChange }: StringSliderProps) {
  return (
    <Slider
      label={label}
      min={0}
      max={values.length - 1}
      step={1}
      value={value}
      displayValue={values[value] || values[0]}
      onChange={onChange}
    />
  );
}

import Section from '../components/section';
import SkinToneBar from '../components/skin-tone-bar';
import Slider from '../components/slider';
import StringSlider from '../components/string-slider';
import { bodyTypes } from '../constants';

interface BodyTabProps {
  gender: 'male' | 'female';
  skinTone: number;
  bodyType: number;
  currentFaceFeatures: Record<string, number>;
  onSkinToneChange: (value: number) => void;
  onBodyTypeChange: (value: number) => void;
  onFaceFeatureChange: (featureId: number, value: number) => void;
}

export default function BodyTab({
  gender,
  skinTone,
  bodyType,
  currentFaceFeatures,
  onSkinToneChange,
  onBodyTypeChange,
  onFaceFeatureChange,
}: BodyTabProps) {
  return (
    <>
      <Section label="Skin">
        <SkinToneBar value={skinTone} onChange={onSkinToneChange} />
      </Section>

      <Section label="Build">
        <StringSlider label="Body Type" values={bodyTypes} value={bodyType} onChange={onBodyTypeChange} />
        <Slider
          label="Body Weight"
          min={-10}
          max={10}
          step={0.1}
          value={currentFaceFeatures['2007'] || 0}
          resetTo={0}
          onChange={(value) => onFaceFeatureChange(2007, value)}
        />
        <Slider
          label="Muscles"
          min={-2.5}
          max={2.5}
          step={0.1}
          value={currentFaceFeatures['65374'] || 0}
          resetTo={0}
          onChange={(value) => onFaceFeatureChange(65374, value)}
        />
        <Slider
          label="Anterior Trapezius"
          min={-1}
          max={1}
          step={0.1}
          value={currentFaceFeatures['33485'] || 0}
          resetTo={0}
          onChange={(value) => onFaceFeatureChange(33485, value)}
        />
      </Section>

      {gender === 'female' && (
        <Section label="Female Build">
          <Slider
            label="Chest Height"
            min={-1.5}
            max={2.5}
            step={0.1}
            value={currentFaceFeatures['46240'] || 0}
            resetTo={0}
            onChange={(value) => onFaceFeatureChange(46240, value)}
          />
          <Slider
            label="Butt/Hip Size"
            min={-1}
            max={2.5}
            step={0.1}
            value={currentFaceFeatures['8991'] || 0}
            resetTo={0}
            onChange={(value) => onFaceFeatureChange(8991, value)}
          />
        </Section>
      )}
    </>
  );
}

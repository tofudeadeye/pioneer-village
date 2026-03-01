import OverlaySelector from '../components/overlay-selector';
import Section from '../components/section';

interface OverlaysTabProps {
  overlays: Record<string, UI.Customization.OverlayJson>;
  currentLayers: UI.Customization.LayerData[];
  onLayersChange: (layers: UI.Customization.LayerData[]) => void;
}

export default function OverlaysTab({ overlays, currentLayers, onLayersChange }: OverlaysTabProps) {
  return (
    <Section label="Overlays">
      <OverlaySelector overlays={overlays} layers={currentLayers} onChange={onLayersChange} />
    </Section>
  );
}

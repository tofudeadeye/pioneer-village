interface BirdTypeConfig {
  model: string;
  letterModel: string;
  speed: number;
  staminaCostPerDelivery: number;
  maxStamina: number;
}

const BirdTypes: Record<string, BirdTypeConfig> = {
  pigeon: {
    model: 'A_C_PIGEON',
    letterModel: 'p_letterenvelope_cs01x',
    speed: 37.5,
    staminaCostPerDelivery: 15,
    maxStamina: 100,
  },
  crow: {
    model: 'A_C_CROW_01',
    letterModel: 'p_letterenvelope_cs01x',
    speed: 42.5,
    staminaCostPerDelivery: 12,
    maxStamina: 100,
  },
  owl: {
    model: 'A_C_OWL_01',
    letterModel: 'p_letterenvelope_cs01x',
    speed: 55.0,
    staminaCostPerDelivery: 10,
    maxStamina: 100,
  },
};

export default BirdTypes;
export type { BirdTypeConfig };

import { Log, awaitUI } from '@lib/client/comms/ui';
import { Vector3 } from '@lib/math';

export default class Horse {
  _id: number;
  _name: string;
  _ownerId: number;
  _stable: string | null;
  _brandId: number | null;
  _breeds: Horse.BreedRecord | null;
  _components: number[] | any;
  _model: number;
  _gender: 'MALE' | 'FEMALE' | 'OTHER';
  _age: number;
  _weight: number;
  _food: number;
  _water: number;
  _health: number;
  _cleanliness: number;
  _neuteredFixed: boolean;
  _statOffRoad: number;
  _statHealth: number;
  _statEndurance: number;
  _statFertility: number;
  _statHandling: number;
  _statSpeed: number;
  _statAcceleration: number;
  _statBonding: Record<number, number>; // Record<CharacterId, Bonding>
  _hooves: number;
  _horseshoes: number;
  _metadata: Record<string, any> | null;
  _lastX: number;
  _lastY: number;
  _lastZ: number;
  _createdAt: Date;

  _dirtyFields: Set<string> = new Set();

  constructor(data: Horse.Data) {
    this._id = data.id;
    this._name = data.name;
    this._ownerId = data.ownerId;
    this._stable = data.stable;
    this._brandId = data.brandId;
    this._breeds = data.breeds;
    this._components = data.components;
    this._model = data.model;
    this._gender = data.gender;
    this._age = data.age;
    this._weight = data.weight;
    this._food = data.food;
    this._water = data.water;
    this._health = data.health;
    this._cleanliness = data.cleanliness;
    this._neuteredFixed = data.neuteredFixed;
    this._statOffRoad = data.statOffRoad;
    this._statHealth = data.statHealth;
    this._statEndurance = data.statEndurance;
    this._statFertility = data.statFertility;
    this._statHandling = data.statHandling;
    this._statSpeed = data.statSpeed;
    this._statAcceleration = data.statAcceleration;
    this._statBonding = data.statBonding;
    this._hooves = data.hooves;
    this._horseshoes = data.horseshoes;
    this._metadata = data.metadata;
    this._lastX = data.lastX;
    this._lastY = data.lastY;
    this._lastZ = data.lastZ;
    this._createdAt = new Date(data.createdAt);
  }

  // Read-only property - no setter needed as ID shouldn't change
  get id(): number {
    return this._id;
  }

  // Basic properties
  get name(): string {
    return this._name;
  }
  set name(name: string) {
    this._name = name;
    this._dirtyFields.add('name');
  }

  get ownerId(): number {
    return this._ownerId;
  }
  set ownerId(ownerId: number) {
    this._ownerId = ownerId;
    this._dirtyFields.add('ownerId');
  }

  get stable(): string | null {
    return this._stable;
  }
  set stable(stable: string | null) {
    this._stable = stable;
    this._dirtyFields.add('stable');
  }

  get brandId(): number | null {
    return this._brandId;
  }
  set brandId(brandId: number | null) {
    this._brandId = brandId;
    this._dirtyFields.add('brandId');
  }

  // Breed and appearance
  get breeds(): Horse.BreedRecord | null {
    return this._breeds;
  }
  set breeds(breeds: Horse.BreedRecord | null) {
    this._breeds = breeds;
    this._dirtyFields.add('breeds');
  }

  get components(): number[] | any {
    return this._components;
  }
  set components(components: number[] | any) {
    this._components = components;
    this._dirtyFields.add('components');
  }

  get model(): number {
    return this._model;
  }
  set model(model: number) {
    this._model = model;
    this._dirtyFields.add('model');
  }

  get gender(): 'MALE' | 'FEMALE' | 'OTHER' {
    return this._gender;
  }
  set gender(gender: 'MALE' | 'FEMALE' | 'OTHER') {
    this._gender = gender;
    this._dirtyFields.add('gender');
  }

  // Physical attributes
  get age(): number {
    return this._age;
  }
  set age(age: number) {
    this._age = age;
    this._dirtyFields.add('age');
  }

  get weight(): number {
    return this._weight;
  }
  set weight(weight: number) {
    this._weight = weight;
    this._dirtyFields.add('weight');
  }

  // Vital stats
  get food(): number {
    return this._food;
  }
  set food(food: number) {
    // Clamp between 0 and 100
    this._food = Math.max(0, Math.min(100, food));
    this._dirtyFields.add('food');
  }

  get water(): number {
    return this._water;
  }
  set water(water: number) {
    // Clamp between 0 and 100
    this._water = Math.max(0, Math.min(100, water));
    this._dirtyFields.add('water');
  }

  get health(): number {
    return this._health;
  }
  set health(health: number) {
    // Clamp between 0 and 100
    this._health = Math.max(0, Math.min(100, health));
    this._dirtyFields.add('health');
  }

  get cleanliness(): number {
    return this._cleanliness;
  }
  set cleanliness(cleanliness: number) {
    // Clamp between 0 and 100
    this._cleanliness = Math.max(0, Math.min(100, cleanliness));
    this._dirtyFields.add('cleanliness');
  }

  get neuteredFixed(): boolean {
    return this._neuteredFixed;
  }
  set neuteredFixed(neuteredFixed: boolean) {
    this._neuteredFixed = neuteredFixed;
    this._dirtyFields.add('neuteredFixed');
  }

  // Performance stats
  get statOffRoad(): number {
    return this._statOffRoad;
  }
  set statOffRoad(statOffRoad: number) {
    this._statOffRoad = statOffRoad;
    this._dirtyFields.add('statOffRoad');
  }

  get statHealth(): number {
    return this._statHealth;
  }
  set statHealth(statHealth: number) {
    this._statHealth = statHealth;
    this._dirtyFields.add('statHealth');
  }

  get statEndurance(): number {
    return this._statEndurance;
  }
  set statEndurance(statEndurance: number) {
    this._statEndurance = statEndurance;
    this._dirtyFields.add('statEndurance');
  }

  get statFertility(): number {
    return this._statFertility;
  }
  set statFertility(statFertility: number) {
    this._statFertility = statFertility;
    this._dirtyFields.add('statFertility');
  }

  get statHandling(): number {
    return this._statHandling;
  }
  set statHandling(statHandling: number) {
    this._statHandling = statHandling;
    this._dirtyFields.add('statHandling');
  }

  get statSpeed(): number {
    return this._statSpeed;
  }
  set statSpeed(statSpeed: number) {
    this._statSpeed = statSpeed;
    this._dirtyFields.add('statSpeed');
  }

  get statAcceleration(): number {
    return this._statAcceleration;
  }
  set statAcceleration(statAcceleration: number) {
    this._statAcceleration = statAcceleration;
    this._dirtyFields.add('statAcceleration');
  }

  get statBonding(): Record<number, number> {
    return this._statBonding;
  }
  set statBonding(statBonding: Record<number, number>) {
    this._statBonding = statBonding;
    this._dirtyFields.add('statBonding');
  }

  // Maintenance attributes
  get hooves(): number {
    return this._hooves;
  }
  set hooves(hooves: number) {
    // Clamp between 0 and 100
    this._hooves = Math.max(0, Math.min(100, hooves));
    this._dirtyFields.add('hooves');
  }

  get horseshoes(): number {
    return this._horseshoes;
  }
  set horseshoes(horseshoes: number) {
    // Clamp between 0 and 100
    this._horseshoes = Math.max(0, Math.min(100, horseshoes));
    this._dirtyFields.add('horseshoes');
  }

  // Metadata and location
  get metadata(): Record<string, any> | null {
    return this._metadata;
  }
  set metadata(metadata: Record<string, any> | null) {
    this._metadata = metadata;
    this._dirtyFields.add('metadata');
  }

  get lastX(): number {
    return this._lastX;
  }
  set lastX(lastX: number) {
    this._lastX = lastX;
    this._dirtyFields.add('lastX');
  }

  get lastY(): number {
    return this._lastY;
  }
  set lastY(lastY: number) {
    this._lastY = lastY;
    this._dirtyFields.add('lastY');
  }

  get lastZ(): number {
    return this._lastZ;
  }
  set lastZ(lastZ: number) {
    this._lastZ = lastZ;
    this._dirtyFields.add('lastZ');
  }

  // Read-only property - creation date shouldn't change
  get createdAt(): Date {
    return this._createdAt;
  }

  // Helper method to update position at once
  setPosition(x: number, y: number, z: number): void {
    this._lastX = x;
    this._lastY = y;
    this._lastZ = z;
    this._dirtyFields.add('lastX');
    this._dirtyFields.add('lastY');
    this._dirtyFields.add('lastZ');
  }

  // Helper method to get position as vector
  getPosition(): Vector3 {
    return Vector3.fromArray([this._lastX, this._lastY, this._lastZ]);
  }

  // Helper method to update bonding for a specific character
  setBondingForCharacter(characterId: number, bondingLevel: number): void {
    if (!this._statBonding) {
      this._statBonding = {};
    }
    this._statBonding[characterId] = Math.max(0, Math.min(100, bondingLevel));
    this._dirtyFields.add('statBonding');
  }

  // Helper method to get bonding for a specific character
  getBondingForCharacter(characterId: number): number {
    return this._statBonding?.[characterId] ?? 0;
  }

  // Check if any fields have been modified
  get isDirty(): boolean {
    return this._dirtyFields.size > 0;
  }

  // Get list of modified fields
  get dirtyFields(): string[] {
    return Array.from(this._dirtyFields);
  }

  async save() {
    if (!this.isDirty) {
      return;
    }
    Log(`Saving Horse: ${this._name}`);

    const dirtyData: Horse.DirtyData = {
      id: this._id, // Always include ID for identification
    };

    // Type-safe field mapping using a strongly-typed approach
    // Maps dirty field names to their corresponding property values
    type FieldGetters = {
      [K in keyof Omit<Horse.Data, 'id' | 'createdAt'>]: () => Horse.Data[K];
    };

    const fieldMapping: FieldGetters = {
      // Note: id is read-only, so it's not included here
      name: () => this._name,
      ownerId: () => this._ownerId,
      stable: () => this._stable,
      brandId: () => this._brandId,
      breeds: () => this._breeds,
      components: () => this._components,
      model: () => this._model,
      gender: () => this._gender,
      age: () => this._age,
      weight: () => this._weight,
      food: () => this._food,
      water: () => this._water,
      health: () => this._health,
      cleanliness: () => this._cleanliness,
      neuteredFixed: () => this._neuteredFixed,
      statOffRoad: () => this._statOffRoad,
      statHealth: () => this._statHealth,
      statEndurance: () => this._statEndurance,
      statFertility: () => this._statFertility,
      statHandling: () => this._statHandling,
      statSpeed: () => this._statSpeed,
      statAcceleration: () => this._statAcceleration,
      statBonding: () => this._statBonding,
      hooves: () => this._hooves,
      horseshoes: () => this._horseshoes,
      metadata: () => this._metadata,
      lastX: () => this._lastX,
      lastY: () => this._lastY,
      lastZ: () => this._lastZ,
      // Note: createdAt is read-only, so it's not included here
    };

    // Build the dirty data object with only modified fields
    for (const field of this._dirtyFields.values()) {
      // Type-safe field assignment using keyof
      if (field in fieldMapping) {
        const fieldKey = field as keyof FieldGetters;
        const getValue = fieldMapping[fieldKey];

        // Safely assign the value with proper typing
        Object.assign(dirtyData, { [field]: getValue() });
      } else {
        Log(`Warning: Unknown dirty field '${field}' in Horse save()`);
      }
    }

    // TODO: Send dirtyData to server/database for persistence
    // Example: emitServer('stable.update-horse', dirtyData);
    const result = await awaitUI('stable.save-horse', dirtyData);
    Log(`Horse save result: ${result}`);
    Log(`Saved Horse #${this._id} with fields: ${Array.from(this._dirtyFields).join(', ')}`);

    // Clear dirty fields after successful save
    this._dirtyFields.clear();
  }
}

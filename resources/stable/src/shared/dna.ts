// ===========================
// Type Definitions
// ===========================
import HorseExpressions from './data/horse-expressions';

type GeneValue = number | string | boolean | any[] | Record<string, any>;
type DataType = 'number' | 'string' | 'boolean' | 'array' | 'object' | 'custom';
type InheritanceMode = 'random' | 'weighted' | 'blend' | 'dominant' | 'codominant' | 'incomplete-dominant';
type SelectionStrategy = 'random' | 'tournament' | 'roulette' | 'rank' | 'elite';

// Gene definition with enhanced properties
interface GeneDefinition {
  name: string;
  shorthand: string;
  dominance: number; // 0-1, higher values are more likely to be inherited
  mutationRate: number; // 0-1, chance of random mutation
  dataType: DataType;
  validator?: (value: any) => boolean;
  mutationStrategy?: MutationStrategy;
  minValue?: number;
  maxValue?: number;
  possibleValues?: any[]; // For enum-like genes
  dependencies?: string[]; // Genes that must exist with this one
  incompatible?: string[]; // Genes that cannot coexist
  metadata?: Record<string, any>;
}

// Mutation strategy for custom mutation logic
interface MutationStrategy {
  mutate(value: any, definition: GeneDefinition): any;
}

// Gene instance with generic type support
interface Gene<T extends GeneValue = GeneValue> {
  name: string;
  value: T;
  metadata?: Record<string, any>;
}

// Enhanced crossover options
interface CrossoverOptions {
  crossoverRate?: number;
  mutationRate?: number; // Global rate, can be overridden by gene-specific rates
  inheritanceMode?: InheritanceMode;
  elitism?: number; // Percentage of best individuals to preserve
  crossoverPoints?: number; // For multi-point crossover
}

// Fitness function for population evolution
type FitnessFunction = (dna: DNA) => number;

// Population statistics
interface PopulationStats {
  size: number;
  averageFitness: number;
  maxFitness: number;
  minFitness: number;
  diversity: number;
  generation: number;
  alleleFrequencies: Map<string, Map<any, number>>;
}

// ===========================
// Built-in Mutation Strategies
// ===========================

class GaussianMutation implements MutationStrategy {
  constructor(private stdDev: number = 0.1) {}

  mutate(value: any, definition: GeneDefinition): any {
    if (typeof value !== 'number') return value;

    const numValue = value as number;
    const gaussian = this.randomGaussian();
    let mutated = numValue + numValue * this.stdDev * gaussian;

    // Apply bounds if defined
    if (definition.minValue !== undefined) {
      mutated = Math.max(definition.minValue, mutated);
    }
    if (definition.maxValue !== undefined) {
      mutated = Math.min(definition.maxValue, mutated);
    }

    return mutated;
  }

  private randomGaussian(): number {
    let u = 0,
      v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }
}

class CreepMutation implements MutationStrategy {
  constructor(private creepRate: number = 0.05) {}

  mutate(value: any, definition: GeneDefinition): any {
    if (typeof value !== 'number') return value;

    const numValue = value as number;
    const change = (Math.random() - 0.5) * 2 * this.creepRate;
    let mutated = numValue * (1 + change);

    if (definition.minValue !== undefined) {
      mutated = Math.max(definition.minValue, mutated);
    }
    if (definition.maxValue !== undefined) {
      mutated = Math.min(definition.maxValue, mutated);
    }

    return mutated;
  }
}

class SwapMutation implements MutationStrategy {
  mutate(value: any, definition: GeneDefinition): any {
    if (!Array.isArray(value) || value.length < 2) return value;
    const newArray = [...value];
    const idx1 = Math.floor(Math.random() * newArray.length);
    const idx2 = Math.floor(Math.random() * newArray.length);
    [newArray[idx1], newArray[idx2]] = [newArray[idx2], newArray[idx1]];
    return newArray;
  }
}

// ===========================
// Gene Registry (Singleton)
// ===========================

class GeneRegistry {
  private static instance: GeneRegistry;
  private geneDefinitions: Map<string, GeneDefinition> = new Map();
  private shorthandMap: Map<string, string> = new Map(); // shorthand -> name
  private version: number = 1;

  private constructor() {}

  static getInstance(): GeneRegistry {
    if (!GeneRegistry.instance) {
      GeneRegistry.instance = new GeneRegistry();
    }
    return GeneRegistry.instance;
  }

  // Generate predictable shorthand for gene name
  private generateShorthand(geneName: string): string {
    const hash = this.simpleHash(geneName);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    let shorthand = geneName.charAt(0).toUpperCase();
    let attempts = 0;

    while (this.shorthandMap.has(shorthand) && attempts < 10) {
      const nextCharIndex = (hash + attempts) % chars.length;
      const nextChar = chars[nextCharIndex];

      if (shorthand.length === 1) {
        const secondChar = geneName.length > 1 ? geneName.charAt(1).toLowerCase() : nextChar.toLowerCase();
        shorthand += secondChar;
      } else {
        shorthand += nextChar.toLowerCase();
      }
      attempts++;
    }

    return shorthand;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // Register a single gene
  registerGene(options: Partial<GeneDefinition> & { name: string }): string {
    const normalizedName = options.name.toLowerCase();

    // Return existing if already registered
    if (this.geneDefinitions.has(normalizedName)) {
      return this.geneDefinitions.get(normalizedName)!.shorthand;
    }

    // Validate dominance
    const dominance = options.dominance ?? 0.5;
    if (dominance < 0 || dominance > 1) {
      throw new Error(`Dominance must be between 0 and 1, got ${dominance}`);
    }

    // Validate mutation rate
    const mutationRate = options.mutationRate ?? 0.01;
    if (mutationRate < 0 || mutationRate > 1) {
      throw new Error(`Mutation rate must be between 0 and 1, got ${mutationRate}`);
    }

    // Generate or validate shorthand
    let shorthand: string;
    if (options.shorthand) {
      if (this.shorthandMap.has(options.shorthand)) {
        throw new Error(
          `Shorthand '${options.shorthand}' is already taken by gene '${this.shorthandMap.get(options.shorthand)}'`,
        );
      }
      shorthand = options.shorthand;
    } else {
      shorthand = this.generateShorthand(normalizedName);
    }

    const definition: GeneDefinition = {
      name: normalizedName,
      shorthand,
      dominance,
      mutationRate,
      dataType: options.dataType ?? 'number',
      validator: options.validator,
      mutationStrategy: options.mutationStrategy,
      minValue: options.minValue,
      maxValue: options.maxValue,
      possibleValues: options.possibleValues,
      dependencies: options.dependencies,
      incompatible: options.incompatible,
      metadata: options.metadata,
    };

    this.geneDefinitions.set(normalizedName, definition);
    this.shorthandMap.set(shorthand, normalizedName);

    return shorthand;
  }

  // Batch register multiple genes
  registerGenes(definitions: Array<Partial<GeneDefinition> & { name: string }>): Map<string, string> {
    const results = new Map<string, string>();
    for (const def of definitions) {
      const shorthand = this.registerGene(def);
      results.set(def.name, shorthand);
    }
    return results;
  }

  // Update an existing gene definition
  updateGene(name: string, updates: Partial<Omit<GeneDefinition, 'name' | 'shorthand'>>): void {
    const normalizedName = name.toLowerCase();
    const existing = this.geneDefinitions.get(normalizedName);

    if (!existing) {
      throw new Error(`Gene '${name}' is not registered`);
    }

    this.geneDefinitions.set(normalizedName, { ...existing, ...updates });
    this.version++;
  }

  getGeneDefinition(name: string): GeneDefinition | undefined {
    return this.geneDefinitions.get(name.toLowerCase());
  }

  getGeneName(shorthand: string): string | undefined {
    return this.shorthandMap.get(shorthand);
  }

  isRegistered(name: string): boolean {
    return this.geneDefinitions.has(name.toLowerCase());
  }

  getAllDefinitions(): GeneDefinition[] {
    return Array.from(this.geneDefinitions.values());
  }

  // Export registry for persistence
  export(): string {
    return JSON.stringify({
      version: this.version,
      definitions: Array.from(this.geneDefinitions.entries()),
      shorthands: Array.from(this.shorthandMap.entries()),
    });
  }

  // Import registry from persistence
  import(data: string): void {
    const parsed = JSON.parse(data);
    this.version = parsed.version;
    this.geneDefinitions = new Map(parsed.definitions);
    this.shorthandMap = new Map(parsed.shorthands);
  }

  clear(): void {
    this.geneDefinitions.clear();
    this.shorthandMap.clear();
    this.version++;
  }
}

// ===========================
// DNA Class
// ===========================

class DNA {
  private genes: Map<string, Gene> = new Map();
  private static registry = GeneRegistry.getInstance();
  private _fitness?: number;
  private _metadata: Record<string, any> = {};

  constructor(genes: Gene[] = []) {
    genes.forEach((gene) => this.addGene(gene));
  }

  // Add a gene with validation
  addGene(gene: Gene): void {
    const normalizedName = gene.name.toLowerCase();
    const definition = DNA.registry.getGeneDefinition(normalizedName);

    if (!definition) {
      throw new Error(`Gene '${gene.name}' must be registered before use`);
    }

    // Validate gene value
    if (definition.validator && !definition.validator(gene.value)) {
      throw new Error(`Invalid value for gene '${gene.name}': ${gene.value}`);
    }

    // Check dependencies
    if (definition.dependencies) {
      for (const dep of definition.dependencies) {
        if (!this.genes.has(dep.toLowerCase())) {
          throw new Error(`Gene '${gene.name}' requires gene '${dep}' to be present`);
        }
      }
    }

    // Check incompatibilities
    if (definition.incompatible) {
      for (const incomp of definition.incompatible) {
        if (this.genes.has(incomp.toLowerCase())) {
          throw new Error(`Gene '${gene.name}' is incompatible with gene '${incomp}'`);
        }
      }
    }

    this.genes.set(normalizedName, gene);
  }

  // Batch add genes
  addGenes(genes: Gene[]): void {
    genes.forEach((gene) => this.addGene(gene));
  }

  getGene<T extends GeneValue = GeneValue>(name: string): Gene<T> | undefined {
    return this.genes.get(name.toLowerCase()) as Gene<T> | undefined;
  }

  hasGene(name: string): boolean {
    return this.genes.has(name.toLowerCase());
  }

  removeGene(name: string): boolean {
    return this.genes.delete(name.toLowerCase());
  }

  updateGene<T extends GeneValue = GeneValue>(name: string, value: T): void {
    const gene = this.genes.get(name.toLowerCase());
    if (gene) {
      const definition = DNA.registry.getGeneDefinition(name);
      if (definition?.validator && !definition.validator(value)) {
        throw new Error(`Invalid value for gene '${name}': ${value}`);
      }
      gene.value = value;
    }
  }

  getAllGenes(): Gene[] {
    return Array.from(this.genes.values());
  }

  // Get/set fitness (cached for performance)
  get fitness(): number | undefined {
    return this._fitness;
  }

  set fitness(value: number | undefined) {
    this._fitness = value;
  }

  // Get/set metadata
  get metadata(): Record<string, any> {
    return this._metadata;
  }

  set metadata(value: Record<string, any>) {
    this._metadata = value;
  }

  // Enhanced crossover with multiple modes
  static crossover(parent1: DNA, parent2: DNA, options: CrossoverOptions = {}): DNA {
    const { crossoverRate = 0.5, inheritanceMode = 'weighted', crossoverPoints = 1 } = options;

    const childGenes: Gene[] = [];
    const allGeneNames = new Set([...parent1.genes.keys(), ...parent2.genes.keys()]);

    if (crossoverPoints > 1) {
      // Multi-point crossover
      const geneArray = Array.from(allGeneNames);
      const points = this.generateCrossoverPoints(geneArray.length, crossoverPoints);
      let useParent1 = true;

      geneArray.forEach((geneName, index) => {
        if (points.includes(index)) {
          useParent1 = !useParent1;
        }

        const gene = useParent1 ? parent1.getGene(geneName) : parent2.getGene(geneName);

        if (gene) {
          childGenes.push(this.possiblyMutate({ ...gene }));
        }
      });
    } else {
      // Single-point or gene-by-gene crossover
      allGeneNames.forEach((geneName) => {
        const gene1 = parent1.getGene(geneName);
        const gene2 = parent2.getGene(geneName);

        let inheritedGene: Gene;

        if (gene1 && gene2) {
          inheritedGene = this.selectGeneFromParents(gene1, gene2, inheritanceMode);
        } else if (gene1) {
          inheritedGene = { ...gene1 };
        } else if (gene2) {
          inheritedGene = { ...gene2 };
        } else {
          return;
        }

        childGenes.push(this.possiblyMutate(inheritedGene));
      });
    }

    return new DNA(childGenes);
  }

  private static generateCrossoverPoints(length: number, points: number): number[] {
    const result: number[] = [];
    while (result.length < points) {
      const point = Math.floor(Math.random() * (length - 1)) + 1;
      if (!result.includes(point)) {
        result.push(point);
      }
    }
    return result.sort((a, b) => a - b);
  }

  private static selectGeneFromParents(gene1: Gene, gene2: Gene, mode: InheritanceMode): Gene {
    const definition = DNA.registry.getGeneDefinition(gene1.name);
    const dominance1 = definition?.dominance ?? 0.5;
    const dominance2 = DNA.registry.getGeneDefinition(gene2.name)?.dominance ?? 0.5;

    switch (mode) {
      case 'random':
        return Math.random() < 0.5 ? { ...gene1 } : { ...gene2 };

      case 'weighted':
        const totalDominance = dominance1 + dominance2;
        const gene1Chance = dominance1 / totalDominance;
        return Math.random() < gene1Chance ? { ...gene1 } : { ...gene2 };

      case 'blend':
        if (typeof gene1.value === 'number' && typeof gene2.value === 'number') {
          const value1 = gene1.value as number;
          const value2 = gene2.value as number;
          const blendRatio = Math.random();
          return {
            ...gene1,
            value: value1 * blendRatio + value2 * (1 - blendRatio),
          };
        }
        return Math.random() < 0.5 ? { ...gene1 } : { ...gene2 };

      case 'dominant':
        return dominance1 >= dominance2 ? { ...gene1 } : { ...gene2 };

      case 'codominant':
        // Both alleles express equally
        if (typeof gene1.value === 'number' && typeof gene2.value === 'number') {
          const value1 = gene1.value as number;
          const value2 = gene2.value as number;
          return {
            ...gene1,
            value: (value1 + value2) / 2,
          };
        }
        return Math.random() < 0.5 ? { ...gene1 } : { ...gene2 };

      case 'incomplete-dominant':
        // Blend with bias toward dominant
        if (typeof gene1.value === 'number' && typeof gene2.value === 'number') {
          const value1 = gene1.value as number;
          const value2 = gene2.value as number;
          const dominantValue = dominance1 >= dominance2 ? value1 : value2;
          const recessiveValue = dominance1 >= dominance2 ? value2 : value1;
          const bias = 0.7; // 70% toward dominant
          return {
            ...gene1,
            value: dominantValue * bias + recessiveValue * (1 - bias),
          };
        }
        return dominance1 >= dominance2 ? { ...gene1 } : { ...gene2 };

      default:
        return Math.random() < 0.5 ? { ...gene1 } : { ...gene2 };
    }
  }

  private static possiblyMutate(gene: Gene): Gene {
    const definition = DNA.registry.getGeneDefinition(gene.name);
    if (!definition || Math.random() >= definition.mutationRate) {
      return gene;
    }

    const mutatedGene = { ...gene };

    // Use custom mutation strategy if available
    if (definition.mutationStrategy) {
      mutatedGene.value = definition.mutationStrategy.mutate(gene.value, definition);
      return mutatedGene;
    }

    // Default mutation strategies by type
    switch (definition.dataType) {
      case 'number':
        if (typeof gene.value === 'number') {
          const mutation = new GaussianMutation();
          mutatedGene.value = mutation.mutate(gene.value, definition);
        }
        break;

      case 'string':
        if (typeof gene.value === 'string' && definition.possibleValues) {
          // Pick random from possible values
          const currentValue = gene.value as string;
          const others = definition.possibleValues.filter((v) => v !== currentValue);
          if (others.length > 0) {
            mutatedGene.value = others[Math.floor(Math.random() * others.length)];
          }
        }
        break;

      case 'boolean':
        if (typeof gene.value === 'boolean') {
          mutatedGene.value = !gene.value;
        }
        break;

      case 'array':
        if (Array.isArray(gene.value)) {
          const mutation = new SwapMutation();
          mutatedGene.value = mutation.mutate(gene.value, definition);
        }
        break;
    }

    return mutatedGene;
  }

  // Merge with another DNA
  merge(other: DNA, conflictResolver?: (gene1: Gene, gene2: Gene) => Gene): DNA {
    const merged = this.clone();

    other.getAllGenes().forEach((gene) => {
      if (merged.hasGene(gene.name) && conflictResolver) {
        const existing = merged.getGene(gene.name)!;
        const resolved = conflictResolver(existing, gene);
        merged.updateGene(resolved.name, resolved.value);
      } else if (!merged.hasGene(gene.name)) {
        merged.addGene(gene);
      }
    });

    return merged;
  }

  // Compare with another DNA
  similarity(other: DNA): number {
    const allGenes = new Set([...this.genes.keys(), ...other.genes.keys()]);
    let matches = 0;
    let total = 0;

    allGenes.forEach((geneName) => {
      const gene1 = this.getGene(geneName);
      const gene2 = other.getGene(geneName);

      if (gene1 && gene2) {
        total++;
        if (gene1.value === gene2.value) {
          matches++;
        } else if (typeof gene1.value === 'number' && typeof gene2.value === 'number') {
          // For numbers, calculate similarity based on relative difference
          const value1 = gene1.value as number;
          const value2 = gene2.value as number;
          const diff = Math.abs(value1 - value2);
          const avg = (value1 + value2) / 2;
          if (avg !== 0) {
            matches += Math.max(0, 1 - diff / avg);
          }
        }
      }
    });

    return total === 0 ? 0 : matches / total;
  }

  // Serialization
  toJSON(): string {
    return JSON.stringify({
      genes: Array.from(this.genes.entries()),
      metadata: this._metadata,
      fitness: this._fitness,
    });
  }

  static fromJSON(json: string): DNA {
    const data = JSON.parse(json);
    const dna = new DNA();

    const geneEntries: [string, Gene][] = data.genes;
    geneEntries.forEach(([name, gene]) => {
      dna.genes.set(name, gene);
    });

    dna._metadata = data.metadata || {};
    dna._fitness = data.fitness;

    return dna;
  }

  toObject(): Record<string, any> {
    return {
      genes: Array.from(this.genes.entries()),
      metadata: this._metadata,
      fitness: this._fitness,
    };
  }

  static fromObject(data: Record<string, any>): DNA {
    const dna = new DNA();

    const geneEntries: [string, Gene][] = data.genes;
    geneEntries.forEach(([name, gene]) => {
      dna.genes.set(name, gene);
    });

    dna._metadata = data.metadata || {};
    dna._fitness = data.fitness;

    return dna;
  }

  toShortString(): string {
    const geneStrings = this.getAllGenes().map((gene) => {
      const definition = DNA.registry.getGeneDefinition(gene.name);
      const shorthand = definition?.shorthand || gene.name;
      return `${shorthand}:${JSON.stringify(gene.value)}`;
    });
    return geneStrings.join('|');
  }

  static fromShortString(shortString: string): DNA {
    const genes: Gene[] = [];
    const geneParts = shortString.split('|');

    geneParts.forEach((part) => {
      const [shorthand, valueStr] = part.split(':');
      const geneName = DNA.registry.getGeneName(shorthand);

      if (geneName) {
        try {
          const value = JSON.parse(valueStr);
          genes.push({ name: geneName, value });
        } catch {
          // Fallback for backward compatibility
          const value = isNaN(Number(valueStr)) ? valueStr : Number(valueStr);
          genes.push({ name: geneName, value });
        }
      }
    });

    return new DNA(genes);
  }

  toString(): string {
    const geneStrings = this.getAllGenes().map((gene) => {
      const definition = DNA.registry.getGeneDefinition(gene.name);
      const dominance = definition?.dominance?.toFixed(2) ?? '0.50';
      const shorthand = definition?.shorthand ?? gene.name;
      return `${gene.name}(${shorthand}): ${JSON.stringify(gene.value)} [dom: ${dominance}]`;
    });
    return `DNA{\n  ${geneStrings.join('\n  ')}\n}`;
  }

  clone(): DNA {
    const cloned = new DNA(this.getAllGenes().map((gene) => ({ ...gene })));
    cloned._metadata = { ...this._metadata };
    cloned._fitness = this._fitness;
    return cloned;
  }
}

// ===========================
// DNA Builder
// ===========================

class DNABuilder {
  private genes: Gene[] = [];
  private metadata: Record<string, any> = {};

  addGene(name: string, value: any): DNABuilder {
    const registry = GeneRegistry.getInstance();
    if (!registry.isRegistered(name)) {
      throw new Error(`Gene '${name}' must be registered before use`);
    }
    this.genes.push({ name, value });
    return this;
  }

  addGeneByShorthand(shorthand: string, value: any): DNABuilder {
    const registry = GeneRegistry.getInstance();
    const geneName = registry.getGeneName(shorthand);
    if (!geneName) {
      throw new Error(`Unknown gene shorthand: ${shorthand}`);
    }
    return this.addGene(geneName, value);
  }

  addGenes(genes: Array<{ name: string; value: any }>): DNABuilder {
    genes.forEach((gene) => this.addGene(gene.name, gene.value));
    return this;
  }

  withMetadata(key: string, value: any): DNABuilder {
    this.metadata[key] = value;
    return this;
  }

  build(): DNA {
    const dna = new DNA(this.genes);
    dna.metadata = this.metadata;
    return dna;
  }
}

// ===========================
// Enhanced Population Class
// ===========================

class Population {
  private individuals: DNA[] = [];
  private generation: number = 0;
  private fitnessFunction?: FitnessFunction;
  private stats?: PopulationStats;

  constructor(individuals: DNA[] = [], fitnessFunction?: FitnessFunction) {
    this.individuals = [...individuals];
    this.fitnessFunction = fitnessFunction;
    this.evaluateFitness();
  }

  addIndividual(dna: DNA): void {
    this.individuals.push(dna);
    if (this.fitnessFunction) {
      dna.fitness = this.fitnessFunction(dna);
    }
  }

  addIndividuals(dnas: DNA[]): void {
    dnas.forEach((dna) => this.addIndividual(dna));
  }

  setFitnessFunction(fn: FitnessFunction): void {
    this.fitnessFunction = fn;
    this.evaluateFitness();
  }

  evaluateFitness(): void {
    if (!this.fitnessFunction) return;

    this.individuals.forEach((ind) => {
      ind.fitness = this.fitnessFunction!(ind);
    });

    this.updateStats();
  }

  // Selection strategies
  selectParents(strategy: SelectionStrategy = 'tournament', count: number = 2): DNA[] {
    switch (strategy) {
      case 'random':
        return this.randomSelection(count);

      case 'tournament':
        return this.tournamentSelection(count);

      case 'roulette':
        return this.rouletteSelection(count);

      case 'rank':
        return this.rankSelection(count);

      case 'elite':
        return this.eliteSelection(count);

      default:
        return this.randomSelection(count);
    }
  }

  private randomSelection(count: number): DNA[] {
    const selected: DNA[] = [];
    for (let i = 0; i < count; i++) {
      selected.push(this.individuals[Math.floor(Math.random() * this.individuals.length)]);
    }
    return selected;
  }

  private tournamentSelection(count: number, tournamentSize: number = 3): DNA[] {
    const selected: DNA[] = [];

    for (let i = 0; i < count; i++) {
      const tournament: DNA[] = [];
      for (let j = 0; j < tournamentSize; j++) {
        tournament.push(this.individuals[Math.floor(Math.random() * this.individuals.length)]);
      }

      tournament.sort((a, b) => (b.fitness ?? 0) - (a.fitness ?? 0));
      selected.push(tournament[0]);
    }

    return selected;
  }

  private rouletteSelection(count: number): DNA[] {
    if (!this.individuals.every((ind) => ind.fitness !== undefined)) {
      return this.randomSelection(count);
    }

    const totalFitness = this.individuals.reduce((sum, ind) => sum + (ind.fitness ?? 0), 0);
    const selected: DNA[] = [];

    for (let i = 0; i < count; i++) {
      let randomValue = Math.random() * totalFitness;

      for (const individual of this.individuals) {
        randomValue -= individual.fitness ?? 0;
        if (randomValue <= 0) {
          selected.push(individual);
          break;
        }
      }
    }

    return selected;
  }

  private rankSelection(count: number): DNA[] {
    const sorted = [...this.individuals].sort((a, b) => (b.fitness ?? 0) - (a.fitness ?? 0));
    const selected: DNA[] = [];

    for (let i = 0; i < count; i++) {
      // Use rank-based probability
      const rankSum = (this.individuals.length * (this.individuals.length + 1)) / 2;
      let randomValue = Math.random() * rankSum;

      for (let j = 0; j < sorted.length; j++) {
        randomValue -= sorted.length - j;
        if (randomValue <= 0) {
          selected.push(sorted[j]);
          break;
        }
      }
    }

    return selected;
  }

  private eliteSelection(count: number): DNA[] {
    const sorted = [...this.individuals].sort((a, b) => (b.fitness ?? 0) - (a.fitness ?? 0));
    return sorted.slice(0, count);
  }

  // Evolution
  evolve(
    options: {
      selectionStrategy?: SelectionStrategy;
      crossoverOptions?: CrossoverOptions;
      eliteSize?: number;
      populationSize?: number;
    } = {},
  ): void {
    const {
      selectionStrategy = 'tournament',
      crossoverOptions = {},
      eliteSize = Math.floor(this.individuals.length * 0.1),
      populationSize = this.individuals.length,
    } = options;

    const newPopulation: DNA[] = [];

    // Keep elite individuals
    if (eliteSize > 0) {
      const elite = this.eliteSelection(eliteSize);
      newPopulation.push(...elite.map((dna) => dna.clone()));
    }

    // Generate offspring
    while (newPopulation.length < populationSize) {
      const parents = this.selectParents(selectionStrategy, 2);
      const child = DNA.crossover(parents[0], parents[1], crossoverOptions);
      newPopulation.push(child);
    }

    this.individuals = newPopulation.slice(0, populationSize);
    this.generation++;
    this.evaluateFitness();
  }

  // Statistics
  private updateStats(): void {
    if (this.individuals.length === 0) {
      this.stats = undefined;
      return;
    }

    const fitnesses = this.individuals.map((ind) => ind.fitness ?? 0);
    const avgFitness = fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length;
    const maxFitness = Math.max(...fitnesses);
    const minFitness = Math.min(...fitnesses);

    // Calculate diversity (unique gene combinations)
    const uniqueGenotypes = new Set(this.individuals.map((ind) => ind.toShortString()));
    const diversity = uniqueGenotypes.size / this.individuals.length;

    // Calculate allele frequencies
    const alleleFrequencies = new Map<string, Map<any, number>>();

    this.individuals.forEach((ind) => {
      ind.getAllGenes().forEach((gene) => {
        if (!alleleFrequencies.has(gene.name)) {
          alleleFrequencies.set(gene.name, new Map());
        }
        const geneFreqs = alleleFrequencies.get(gene.name)!;
        const count = geneFreqs.get(gene.value) ?? 0;
        geneFreqs.set(gene.value, count + 1);
      });
    });

    this.stats = {
      size: this.individuals.length,
      averageFitness: avgFitness,
      maxFitness,
      minFitness,
      diversity,
      generation: this.generation,
      alleleFrequencies,
    };
  }

  getStats(): PopulationStats | undefined {
    return this.stats;
  }

  getBest(count: number = 1): DNA[] {
    const sorted = [...this.individuals].sort((a, b) => (b.fitness ?? 0) - (a.fitness ?? 0));
    return sorted.slice(0, count);
  }

  getWorst(count: number = 1): DNA[] {
    const sorted = [...this.individuals].sort((a, b) => (a.fitness ?? 0) - (b.fitness ?? 0));
    return sorted.slice(0, count);
  }

  size(): number {
    return this.individuals.length;
  }

  getGeneration(): number {
    return this.generation;
  }

  getAll(): DNA[] {
    return [...this.individuals];
  }

  clear(): void {
    this.individuals = [];
    this.generation = 0;
    this.stats = undefined;
  }
}

// ===========================
// Utility Functions
// ===========================

class DNAUtils {
  private static registry = GeneRegistry.getInstance();

  // Register a gene with builder pattern
  static geneBuilder(name: string) {
    return new GeneDefinitionBuilder(name);
  }

  // Batch operations
  static registerGenes(definitions: Array<Partial<GeneDefinition> & { name: string }>): Map<string, string> {
    return DNAUtils.registry.registerGenes(definitions);
  }

  // Get registry instance for advanced operations
  static getRegistry(): GeneRegistry {
    return DNAUtils.registry;
  }

  // Create DNA from notation
  static createFromNotation(notation: string): DNA {
    return DNA.fromShortString(notation);
  }

  // Compare DNAs
  static compare(
    dna1: DNA,
    dna2: DNA,
  ): {
    similarity: number;
    differences: Array<{ gene: string; value1: any; value2: any }>;
    unique1: string[];
    unique2: string[];
  } {
    const allGenes = new Set([...dna1.getAllGenes().map((g) => g.name), ...dna2.getAllGenes().map((g) => g.name)]);

    const differences: Array<{ gene: string; value1: any; value2: any }> = [];
    const unique1: string[] = [];
    const unique2: string[] = [];

    allGenes.forEach((geneName) => {
      const gene1 = dna1.getGene(geneName);
      const gene2 = dna2.getGene(geneName);

      if (!gene1) {
        unique2.push(geneName);
      } else if (!gene2) {
        unique1.push(geneName);
      } else if (gene1.value !== gene2.value) {
        differences.push({
          gene: geneName,
          value1: gene1.value,
          value2: gene2.value,
        });
      }
    });

    return {
      similarity: dna1.similarity(dna2),
      differences,
      unique1,
      unique2,
    };
  }

  // Generate random DNA based on registered genes
  static generateRandom(geneNames?: string[]): DNA {
    const registry = DNAUtils.registry;
    const genesToUse = geneNames || registry.getAllDefinitions().map((d) => d.name);
    const builder = new DNABuilder();

    genesToUse.forEach((geneName) => {
      const definition = registry.getGeneDefinition(geneName);
      if (!definition) return;

      let value: any;

      if (definition.possibleValues && definition.possibleValues.length > 0) {
        value = definition.possibleValues[Math.floor(Math.random() * definition.possibleValues.length)];
      } else {
        switch (definition.dataType) {
          case 'number':
            const min = definition.minValue ?? 0;
            const max = definition.maxValue ?? 100;
            value = Math.random() * (max - min) + min;
            break;
          case 'boolean':
            value = Math.random() < 0.5;
            break;
          case 'string':
            value = 'random_' + Math.random().toString(36).substring(7);
            break;
          case 'array':
            value = [];
            break;
          default:
            value = null;
        }
      }

      builder.addGene(geneName, value);
    });

    return builder.build();
  }

  // Validate DNA against registry
  static validate(dna: DNA): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const registry = DNAUtils.registry;

    dna.getAllGenes().forEach((gene) => {
      const definition = registry.getGeneDefinition(gene.name);

      if (!definition) {
        errors.push(`Gene '${gene.name}' is not registered`);
        return;
      }

      if (definition.validator && !definition.validator(gene.value)) {
        errors.push(`Gene '${gene.name}' has invalid value: ${gene.value}`);
      }

      if (definition.dataType === 'number' && typeof gene.value === 'number') {
        const numValue = gene.value as number;
        if (definition.minValue !== undefined && numValue < definition.minValue) {
          errors.push(`Gene '${gene.name}' value ${numValue} is below minimum ${definition.minValue}`);
        }
        if (definition.maxValue !== undefined && numValue > definition.maxValue) {
          errors.push(`Gene '${gene.name}' value ${numValue} is above maximum ${definition.maxValue}`);
        }
      }
    });

    // Check dependencies
    dna.getAllGenes().forEach((gene) => {
      const definition = registry.getGeneDefinition(gene.name);
      if (definition?.dependencies) {
        definition.dependencies.forEach((dep) => {
          if (!dna.hasGene(dep)) {
            errors.push(`Gene '${gene.name}' requires gene '${dep}'`);
          }
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// ===========================
// Gene Definition Builder
// ===========================

class GeneDefinitionBuilder {
  private definition: Partial<GeneDefinition> & { name: string };

  constructor(name: string) {
    this.definition = { name };
  }

  dominance(value: number): this {
    this.definition.dominance = value;
    return this;
  }

  mutationRate(value: number): this {
    this.definition.mutationRate = value;
    return this;
  }

  dataType(value: DataType): this {
    this.definition.dataType = value;
    return this;
  }

  shorthand(value: string): this {
    this.definition.shorthand = value;
    return this;
  }

  range(min: number, max: number): this {
    this.definition.minValue = min;
    this.definition.maxValue = max;
    return this;
  }

  possibleValues(values: any[]): this {
    this.definition.possibleValues = values;
    return this;
  }

  validator(fn: (value: any) => boolean): this {
    this.definition.validator = fn;
    return this;
  }

  mutationStrategy(strategy: MutationStrategy): this {
    this.definition.mutationStrategy = strategy;
    return this;
  }

  dependencies(genes: string[]): this {
    this.definition.dependencies = genes;
    return this;
  }

  incompatible(genes: string[]): this {
    this.definition.incompatible = genes;
    return this;
  }

  metadata(data: Record<string, any>): this {
    this.definition.metadata = data;
    return this;
  }

  register(): string {
    return GeneRegistry.getInstance().registerGene(this.definition);
  }
}

// ===========================
// Export Everything
// ===========================

export {
  DNA,
  DNABuilder,
  DNAUtils,
  Population,
  GeneRegistry,
  GeneDefinitionBuilder,

  // Mutation strategies
  GaussianMutation,
  CreepMutation,
  SwapMutation,

  // Types
  type Gene,
  type GeneDefinition,
  type GeneValue,
  type DataType,
  type CrossoverOptions,
  type InheritanceMode,
  type SelectionStrategy,
  type FitnessFunction,
  type MutationStrategy,
  type PopulationStats,
};

// ===========================
// Gene Setup
// ===========================

// <editor-fold desc="Gene Registration">
DNAUtils.geneBuilder('OffRoad')
  .mutationRate(0.5)
  .dataType('number')
  .range(0, 2000)
  .shorthand('O')
  .mutationStrategy(new GaussianMutation(0.025))
  .register();

DNAUtils.geneBuilder('Health')
  .mutationRate(0.5)
  .dataType('number')
  .range(0, 2000)
  .shorthand('H')
  .mutationStrategy(new GaussianMutation(0.025))
  .register();

DNAUtils.geneBuilder('Endurance')
  .mutationRate(0.5)
  .dataType('number')
  .range(0, 2000)
  .shorthand('E')
  .mutationStrategy(new GaussianMutation(0.025))
  .register();

DNAUtils.geneBuilder('Sterile').dominance(0.25).dataType('boolean').shorthand('F').register();

DNAUtils.geneBuilder('Handling')
  .mutationRate(0.5)
  .dataType('number')
  .range(0, 2000)
  .shorthand('Ha')
  .mutationStrategy(new GaussianMutation(0.025))
  .register();

DNAUtils.geneBuilder('Speed')
  .mutationRate(0.5)
  .dataType('number')
  .range(0, 2000)
  .shorthand('S')
  .mutationStrategy(new GaussianMutation(0.025))
  .register();

DNAUtils.geneBuilder('Acceleration')
  .mutationRate(0.5)
  .dataType('number')
  .range(0, 2000)
  .shorthand('A')
  .mutationStrategy(new GaussianMutation(0.025))
  .register();

DNAUtils.geneBuilder('BodyTint0')
  .mutationRate(0.5)
  .dataType('number')
  .range(0, 254)
  .shorthand('BT0')
  .mutationStrategy(new GaussianMutation(3 / 255))
  .register();

DNAUtils.geneBuilder('BodyTint1')
  .mutationRate(0.5)
  .dataType('number')
  .range(0, 254)
  .shorthand('BT1')
  .mutationStrategy(new GaussianMutation(3 / 255))
  .register();

DNAUtils.geneBuilder('BodyTint2')
  .mutationRate(0.5)
  .dataType('number')
  .range(0, 254)
  .shorthand('BT2')
  .mutationStrategy(new GaussianMutation(3 / 255))
  .register();

DNAUtils.geneBuilder('HairTint0')
  .mutationRate(0.5)
  .dataType('number')
  .range(0, 254)
  .shorthand('HT0')
  .mutationStrategy(new GaussianMutation(3 / 255))
  .register();

DNAUtils.geneBuilder('HairTint1')
  .mutationRate(0.5)
  .dataType('number')
  .range(0, 254)
  .shorthand('HT1')
  .mutationStrategy(new GaussianMutation(3 / 255))
  .register();

DNAUtils.geneBuilder('HairTint2')
  .mutationRate(0.5)
  .dataType('number')
  .range(0, 254)
  .shorthand('HT2')
  .mutationStrategy(new GaussianMutation(3 / 255))
  .register();

DNAUtils.geneBuilder('Scale')
  .mutationRate(0.5)
  .dataType('number')
  .range(0.85, 1.15)
  .shorthand('Sc')
  .mutationStrategy(new CreepMutation(0.0333333333))
  .register();

for (const [name, id] of Object.entries(HorseExpressions)) {
  // console.log(`Registering expression gene: ${name} (${id})`);
  const shorthand = name
    .split(' ')
    .map((part) => {
      if (part === 'size') {
        return 'Sz';
      }
      if (part === 'eye') {
        return part.charAt(0).toUpperCase() + part.charAt(1);
      }
      return part.charAt(0).toUpperCase();
    })
    .join('');
  DNAUtils.geneBuilder(name)
    .mutationRate(0.5)
    .dataType('number')
    .range(-1, 1)
    .shorthand(shorthand)
    .mutationStrategy(new GaussianMutation(0.33))
    .register();
}
// </editor-fold>

// ===========================
// Example Usage
// ===========================

/*
// Register genes with the builder pattern
DNAUtils.geneBuilder('strength')
  .dominance(0.7)
  .mutationRate(0.05)
  .dataType('number')
  .range(0, 100)
  .shorthand('STR')
  .mutationStrategy(new GaussianMutation(0.15))
  .register();

DNAUtils.geneBuilder('speed')
  .dominance(0.8)
  .mutationRate(0.03)
  .dataType('number')
  .range(0, 150)
  .shorthand('SPD')
  .register();

DNAUtils.geneBuilder('intelligence')
  .dominance(0.6)
  .mutationRate(0.02)
  .dataType('number')
  .range(0, 200)
  .shorthand('INT')
  .validator(value => value >= 0 && value <= 200)
  .register();

DNAUtils.geneBuilder('eyeColor')
  .dominance(0.3)
  .mutationRate(0.01)
  .dataType('string')
  .possibleValues(['brown', 'blue', 'green', 'hazel', 'gray'])
  .shorthand('EYE')
  .register();

DNAUtils.geneBuilder('hasWings')
  .dominance(0.1)
  .mutationRate(0.005)
  .dataType('boolean')
  .shorthand('WNG')
  .dependencies(['strength']) // Wings require strength
  .register();

// Create parent DNAs
const parent1 = new DNABuilder()
  .addGene('strength', 85)
  .addGene('speed', 60)
  .addGene('intelligence', 90)
  .addGene('eyeColor', 'brown')
  .addGene('hasWings', false)
  .withMetadata('name', 'Parent 1')
  .withMetadata('generation', 0)
  .build();

const parent2 = new DNABuilder()
  .addGene('strength', 70)
  .addGene('speed', 95)
  .addGene('intelligence', 75)
  .addGene('eyeColor', 'blue')
  .addGene('hasWings', true)
  .withMetadata('name', 'Parent 2')
  .withMetadata('generation', 0)
  .build();

// Create offspring with advanced crossover
const child = DNA.crossover(parent1, parent2, {
  inheritanceMode: 'weighted',
  crossoverPoints: 2  // Multi-point crossover
});

console.log('Parent 1:', parent1.toString());
console.log('Parent 2:', parent2.toString());
console.log('Child:', child.toString());

// Compare DNAs
const comparison = DNAUtils.compare(parent1, parent2);
console.log('Similarity:', comparison.similarity);
console.log('Differences:', comparison.differences);

// Create a population with fitness function
const fitnessFunction: FitnessFunction = (dna: DNA) => {
  const strengthGene = dna.getGene<number>('strength');
  const speedGene = dna.getGene<number>('speed');
  const intelligenceGene = dna.getGene<number>('intelligence');
  const wingsGene = dna.getGene<boolean>('hasWings');

  const strength = strengthGene ? strengthGene.value : 0;
  const speed = speedGene ? speedGene.value : 0;
  const intelligence = intelligenceGene ? intelligenceGene.value : 0;
  const hasWings = wingsGene?.value ? 50 : 0;

  return (strength + speed + intelligence + hasWings) / 4;
};

// Initialize population
const population = new Population([parent1, parent2], fitnessFunction);

// Add more individuals
for (let i = 0; i < 10; i++) {
  population.addIndividual(DNAUtils.generateRandom());
}

// Evolve the population
for (let generation = 0; generation < 10; generation++) {
  population.evolve({
    selectionStrategy: 'tournament',
    crossoverOptions: {
      inheritanceMode: 'weighted',
      crossoverPoints: 2
    },
    eliteSize: 2  // Keep best 2 individuals
  });

  const stats = population.getStats();
  console.log(`Generation ${stats?.generation}: Avg Fitness = ${stats?.averageFitness.toFixed(2)}, Diversity = ${stats?.diversity.toFixed(2)}`);
}

// Get the best individual
const best = population.getBest(1)[0];
console.log('Best individual:', best.toString());
console.log('Fitness:', best.fitness);

// Validate DNA
const validation = DNAUtils.validate(best);
console.log('Valid:', validation.valid);
if (!validation.valid) {
  console.log('Errors:', validation.errors);
}

// Export/Import registry for persistence
const registryData = DNAUtils.getRegistry().export();
// Later...
DNAUtils.getRegistry().import(registryData);

// Serialize/Deserialize DNA
const dnaJson = best.toJSON();
const restored = DNA.fromJSON(dnaJson);
console.log('Restored DNA:', restored.toString());



Palette
Tint0
Tint1
Tint2
OffRoad
Health
Endurance
Handling
Speed
Acceleration

Fertility

Bonding
*/

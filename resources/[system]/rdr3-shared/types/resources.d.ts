type PtfxData = {
  looped: boolean;
  evolutions?: string[];
};

type PtfxJson = Record<string, Record<string, PtfxData>>;

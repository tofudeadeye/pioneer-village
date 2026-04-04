type PtfxData = {
  looped: boolean;
  evolutions?: string[];
};

type PtfxJson = Record<string, Record<string, PtfxData>>;

type ComponentsUIData = {
  name: string;
  components: {
    componentHex: string;
    component: number;
    name?: string;
    categoryHex: string;
    category: number;
    categoryName: string;
    type: '0' | '1';
    isMp: boolean;
    isSp: boolean;
    friendlyName?: string;
    palette?: string;
    tint0?: number;
    tint1?: number;
    tint2?: number;
    drawable: string | number;
    albedo: string | number;
    normal: string | number;
    swatchTextureHex?: string;
    swatchTexture?: string;
  }[];
};

type ComponentsUIJson = ComponentsUIData[];

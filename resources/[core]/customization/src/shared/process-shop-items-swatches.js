const fs = require('fs');
const { XMLParser } = require('fast-xml-parser');

const parser = new XMLParser({
  ignoreAttributes: false,
});

String.prototype.GetHashKey = function () {
  const keyLowered = this.toLowerCase();
  const length = this.length;
  let hash, i;

  for (hash = i = 0; i < length; i++) {
    hash += keyLowered.charCodeAt(i);
    hash += hash << 10;
    hash ^= hash >>> 6;
  }

  hash += hash << 3;
  hash ^= hash >>> 11;
  hash += hash << 15;

  return hash;
};

String.prototype.GetHashKeyHex = function() {
  return (this.GetHashKey() >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

const SwatchNames = [
  'uisw_canvas_000',
  'uisw_canvas_ck000',
  'uisw_canvas_ck001',
  'uisw_canvas_ck002',
  'uisw_canvas_ck003',
  'uisw_canvas_sv000',
  'uisw_canvas_sv001',
  'uisw_canvas_sv003',
  'uisw_cotton_000',
  'uisw_cotton_ck000',
  'uisw_cotton_ck001',
  'uisw_cotton_ck002',
  'uisw_cotton_ck003',
  'uisw_cotton_pd000',
  'uisw_cotton_pt000',
  'uisw_cotton_pt001',
  'uisw_cotton_pt002',
  'uisw_cotton_pt003',
  'uisw_cotton_pt004',
  'uisw_cotton_sv000',
  'uisw_cotton_sv001',
  'uisw_cotton_sv003',
  'uisw_denim_000',
  'uisw_denim_ck000',
  'uisw_denim_ck001',
  'uisw_denim_ck002',
  'uisw_denim_ck003',
  'uisw_denim_sv000',
  'uisw_denim_sv001',
  'uisw_denim_sv003',
  'uisw_flat_ck000',
  'uisw_horse_000',
  'uisw_horse_cotton_new000',
  'uisw_horse_cotton_pt001',
  'uisw_horse_cotton_pt002',
  'uisw_horse_cotton_pt003',
  'uisw_horse_cotton_pt004',
  'uisw_horse_cotton_pt005',
  'uisw_horse_cotton_pt006',
  'uisw_horse_cotton_pt007',
  'uisw_horse_cotton_pt008',
  'uisw_horse_cotton_pt009',
  'uisw_horse_cotton_pt010',
  'uisw_horse_cotton_pt011',
  'uisw_horse_cotton_pt012',
  'uisw_horse_cotton_used000',
  'uisw_horse_hair_000',
  'uisw_horse_hair_001',
  'uisw_horse_hair_002',
  'uisw_horse_hair_003',
  'uisw_horse_hair_004',
  'uisw_horse_leather_new000',
  'uisw_horse_leather_used000',
  'uisw_horse_mask_hm000',
  'uisw_horse_mask_hm001',
  'uisw_horse_mask_hm002',
  'uisw_horse_metal_000',
  'uisw_horse_trapperblanket_001',
  'uisw_horse_trapperblanket_002',
  'uisw_horse_trapperblanket_003',
  'uisw_horse_trapperblanket_004',
  'uisw_horse_trapperblanket_005',
  'uisw_leather_000',
  'uisw_leather_cow_000',
  'uisw_leather_pt000',
  'uisw_leather_pt001',
  'uisw_leather_pt002',
  'uisw_eyes_000',
  'uisw_hair_000',
  'uisw_skin_000',
];

const SwatchData = {};

for (const swatchName of SwatchNames) {
  const hash = swatchName.GetHashKeyHex();
  SwatchData[hash] = swatchName;
}

// console.log(SwatchData);

const XMLdata = fs.readFileSync('./temp/shop_items.ymt.pso.xml', 'utf-8');

const jObj = parser.parse(XMLdata);

const MissingSwatches = new Set();

const ItemsData = {}

for (const [ItemListName, ItemList] of Object.entries(jObj.MetaPedShopItemList)) {
  if (!ItemList.Item) continue;
  console.log(`Processing Item List: ${ItemListName}`);

  for (const Item of ItemList.Item) {
    /*
    {
      label: '',
      name: 'YEpmDFA_0xA156BC1F',
      templateName: 'vZYrRXA_0xDFBFB8F4',
      shopCategory: 'heads',
      swatchTexture: 'DbHvcHA_0x6AE4E5B6',
      swatchPalette: 'uPsRvHA_0xA9A440CA',
      swatchTint0: { '@_value': '54' },
      swatchTint1: { '@_value': '54' },
      swatchTint2: { '@_value': '54' },
      assets: {
        Item: {
          drawable: 'mp_head_mr1_006',
          albedo: 'mp_head_mr1_sc03_c0_000_ab',
          normal: 'mp_head_mr1_009_nm',
          material: 'mp_head_mr1_000_m',
          palette: '',
          tint0: [Object],
          tint1: [Object],
          tint2: [Object],
          probability: [Object]
        },
        '@_itemType': 'MetaPedDefExplicitAsset'
      },
      states: '',
      onAddTriggers: '',
      onRemoveTriggers: ''
    }
    */
    try {
      let componentHex = '';

      if (Item.name.includes('_0x')) {
        componentHex = Item.name.split('_0x')[1];
      } else {
        componentHex = Item.name.GetHashKeyHex();
      }

      let swatchTextureHex = '';

      if (Item.swatchTexture.includes('_0x')) {
        swatchTextureHex = Item.swatchTexture.split('_0x')[1];
      } else {
        swatchTextureHex = Item.swatchTexture.GetHashKeyHex();
      }
      const swatchTextureName = SwatchData[swatchTextureHex];

      if (!swatchTextureName) {
        MissingSwatches.add(swatchTextureHex);
        ItemsData[componentHex] = {
          swatchTextureHex: swatchTextureHex,
        }
        continue;
      }
      // console.log(swatchTextureHex, swatchTextureName);
      ItemsData[componentHex] = {
        swatchTextureHex: swatchTextureHex,
        swatchTextureName: swatchTextureName,
        // swatchTint0: Item.swatchTint0 ? Number(Item.swatchTint0['@_value']) : null,
        // swatchTint1: Item.swatchTint1 ? Number(Item.swatchTint1['@_value']) : null,
        // swatchTint2: Item.swatchTint2 ? Number(Item.swatchTint2['@_value']) : null,
      }
    } catch (e) {}
  }
}

// Loop over files in ../../../../[system]/rdr3-shared/components/{}.json
for (const file of fs.readdirSync('../../../../[system]/rdr3-shared/components')) {
  if (!file.endsWith('.json')) return;

  // console.log(`Processing file: ${file}`);
  const data = JSON.parse(fs.readFileSync(`../../../../[system]/rdr3-shared/components/${file}`, 'utf-8'));

  for (const component of data) {
    // console.log(component);
    /*
    {
      "componentHex": "56D85F1C",
      "component": 1457020700,
      "name": "clothing_hl_player_shirt_006_1",
      "categoryHex": "2026C46D",
      "category": 539411565,
      "categoryName": "shirts_full",
      "type": "0",
      "isMp": false,
      "isSp": true,
      "id": 6,
      "friendlyName": "",
      "palette": "",
      "tint0": 255,
      "tint1": 255,
      "tint2": 255,
      "drawable": "player_zero_shirt_006_c_b_full",
      "albedo": "player_zero_shirt_006_c_b_full_g_c0_006_ab",
      "normal": 422686979
    }
    */
    if (component.componentHex && component.componentHex in ItemsData) {
      const itemData = ItemsData[component.componentHex];
      component.swatchTextureHex = itemData.swatchTextureHex;
      if (itemData.swatchTextureName) component.swatchTexture = itemData.swatchTextureName;
      // if (itemData.swatchTint0) component.swatchTint0 = itemData.swatchTint0;
      // if (itemData.swatchTint1) component.swatchTint1 = itemData.swatchTint1;
      // if (itemData.swatchTint2) component.swatchTint2 = itemData.swatchTint2;
    }
  }

  fs.writeFileSync(`../../../../[system]/rdr3-shared/components/${file}`, JSON.stringify(data, null, 2), 'utf-8');
}

MissingSwatches.delete('00000000'); // Remove the default swatch hash
if (MissingSwatches.size !== 0) {
  console.log('Missing Swatches:');
  for (const swatch of MissingSwatches) {
    console.log(swatch);
  }
}

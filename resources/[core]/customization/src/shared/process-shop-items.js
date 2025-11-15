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

const GENERATE_GLOBALS = false;

// <editor-fold defaultstate="collapsed" desc="Global Strings">
const HashLookUp = {};

const clothingStrings = fs.readFileSync('./temp/clothing_hashes.txt', 'utf-8');
const clothingLines = clothingStrings.split('\n');

for (let line of clothingLines) {
  line = line.trim().toLowerCase();
  const hash = line.GetHashKey();

  // HashLookUp[(hash >>> 0).toString(16).toUpperCase()] = line;
  HashLookUp[hash >>> 0] = line;
  // HashLookUp[hash << 0] = line.trim();
}

console.log(`Loaded ${clothingLines.length} clothing hashes.`);

const archiveStrings = fs.readFileSync('./temp/ArchiveItems.txt', 'utf-8');
const archiveLines = archiveStrings.split('\n');

for (const line of archiveLines) {
  const hash = line.trim().GetHashKey();
  HashLookUp[hash >>> 0] = line.trim();

  // if (line.trim().toLowerCase() === 'CLOTHING_F_SEASON3_HAT_001_VAR_001'.toLowerCase()) {
  //   console.log(line);
  //   console.log(hash);
  //   console.log(hash.toString(16));
  // }
}
console.log(`Loaded ${archiveLines.length} archive hashes.`);

const lookupHash = (value, numFallback = false) => {
  let hash = value;
  if (typeof value === 'number' && HashLookUp[value >>> 0]) {
    return HashLookUp[value >>> 0];
  } else if (typeof value === 'string') {
    hash = value.GetHashKey();
    if (HashLookUp[hash >>> 0]) {
      return HashLookUp[hash >>> 0];
    }
  }

  if (numFallback) {
    return hash;
  }

  return '';
};

let GlobalStrings;
if (GENERATE_GLOBALS) {
  GlobalStrings = require('../../../../[system]/rdr3-shared/component-names');

  const GlobalXmlData = fs.readFileSync('./temp/_global.yldb.xml', 'utf-8');
  const jObj = parser.parse(GlobalXmlData);

  const GlobalXmlData2 = fs.readFileSync('./temp/global.yldb.xml', 'utf-8');
  const jObj2 = parser.parse(GlobalXmlData2);

  // _0x
  // const GlobalStrings = {};

  for (const entry of [...jObj.RDR2LanguageDatabase.Entries.Item, ...jObj2.RDR2LanguageDatabase.Entries.Item]) {
    let key = entry['@_hash'];
    if (!key) continue;
    if (key.includes('_0x')) {
      key = key.split('_0x')[1].toUpperCase();
    } else {
      GlobalStrings[key.toUpperCase()] = entry.Text;
      key = (key.GetHashKey() >>> 0).toString(16).toUpperCase();
    }

    // console.log(`${key}: ${entry.Text}`);
    GlobalStrings[key] = entry.Text;
  }

  fs.writeFileSync('./temp/global-strings.json', JSON.stringify(GlobalStrings, null, 2));
} else {
  GlobalStrings = JSON.parse(fs.readFileSync('./temp/global-strings.json', 'utf-8'));
}
console.log(`Loaded ${Object.keys(GlobalStrings).length} global strings.`);
// </editor-fold>

const ColorPaletteNames = {
  ['9AC34F34']: 'metaped_tint_animal',
  ['6765BC15']: 'metaped_tint_combined',
  ['F509C745']: 'metaped_tint_combined_leather',
  ['D20F57FC']: 'metaped_tint_combined_leather1',
  ['E3127A02']: 'metaped_tint_combined_leather2',
  ['B4849CE7']: 'metaped_tint_combined_leather3',
  ['87944303']: 'metaped_tint_combined_leather4',
  ['9629E02E']: 'metaped_tint_combined_leather5',
  ['685F0499']: 'metaped_tint_combined_leather6',
  ['A4CFABD0']: 'metaped_tint_eye',
  ['A646D2AE']: 'metaped_tint_eyes_ui',
  ['AA65D8A3']: 'metaped_tint_generic',
  ['4101ED87']: 'metaped_tint_generic_clean',
  ['F93DB0C8']: 'metaped_tint_generic_weathered',
  ['B562025C']: 'metaped_tint_generic_worn',
  ['DFB1F64C']: 'metaped_tint_hair',
  ['01DF9540']: 'metaped_tint_hair1',
  ['0CBDAAFC']: 'metaped_tint_hair2',
  ['86BC2AF7']: 'metaped_tint_hair_bed',
  ['A9A440CA']: 'metaped_tint_hair_ui',
  ['FB71527B']: 'metaped_tint_hat',
  ['3385C5DB']: 'metaped_tint_hat_clean',
  ['63838A81']: 'metaped_tint_hat_weathered',
  ['17CBCC83']: 'metaped_tint_hat_worn',
  ['A4041CEF']: 'metaped_tint_horse',
  ['3DA3FDCE']: 'metaped_tint_horse_001',
  ['F8F38B6F']: 'metaped_tint_horse_combined',
  ['8BA18876']: 'metaped_tint_horse_leather',
  ['3C49A47B']: 'metaped_tint_horse_leather_001',
  ['D1476963']: 'metaped_tint_leather',
  ['3F6E70FF']: 'metaped_tint_makeup',
  ['D799E1C2']: 'metaped_tint_mpadv',
  ['0ED71EDA']: 'metaped_tint_mpadv_deuteranopia',
  ['0DB270A7']: 'metaped_tint_mpadv_protanopia',
  ['D3CA8EC6']: 'metaped_tint_mpadv_tritanopia',
  ['357284BB']: 'metaped_tint_si_template',
  ['0105607B']: 'metaped_tint_skirt_clean',
  ['B9E7F722']: 'metaped_tint_skirt_weathered',
  ['DC6BC93B']: 'metaped_tint_skirt_worn',
  ['B3BEF137']: 'metaped_tint_teeth',
  ['69ABF60E']: 'weapon_tint_wood',
  ['E25BA89F']: 'weapon_tint_wood_working',
};

const XMLdata = fs.readFileSync('./temp/shop_items.ymt.pso.xml', 'utf-8');

const jObj = parser.parse(XMLdata);

const ShopItems = [];

const datas = {};

const processMetaPedDef = (metaPedDef) => {
  let drawable = metaPedDef.drawable;
  let albedo = metaPedDef.albedo;
  let normal = metaPedDef.normal;
  let palette = metaPedDef.palette;
  let tint0 = Number(metaPedDef.tint0['@_value']);
  let tint1 = Number(metaPedDef.tint1['@_value']);
  let tint2 = Number(metaPedDef.tint2['@_value']);

  if (drawable.includes('_0x')) {
    drawable = lookupHash(parseInt(drawable.split('_0x')[1], 16), true);
  }
  if (albedo.includes('_0x')) {
    albedo = lookupHash(parseInt(albedo.split('_0x')[1], 16), true);
  }
  if (normal.includes('_0x')) {
    normal = lookupHash(parseInt(normal.split('_0x')[1], 16), true);
  }
  if (palette.includes('_0x')) {
    const paletteHex = palette.split('_0x')[1].toUpperCase();
    palette = ColorPaletteNames[paletteHex] || palette;
  }

  return {
    drawable,
    albedo,
    normal,
    palette,
    tint0,
    tint1,
    tint2,
  };
};

const idTintRe = /_([0-9]{2,4})_(?:.*_)?([0-9]{3})_?/;
const idRe = /_([0-9]{3})_/;

for (const [ItemListName, ItemList] of Object.entries(jObj.MetaPedShopItemList)) {
  if (!ItemList.Item) continue;
  console.log(`Processing Item List: ${ItemListName}`);

  for (const Item of ItemList.Item) {
    try {
      let name = Item.name.split('_0x')[1];
      let componentHex = '';

      // console.log(Item);

      if (Item.name.includes('_0x')) {
        componentHex = Item.name.split('_0x')[1];
        name = lookupHash(parseInt(componentHex, 16));
      } else {
        componentHex = (Item.name.GetHashKey() >>> 0).toString(16);
        let newName = lookupHash(parseInt(componentHex, 16));
        if (newName) {
          name = newName;
        }
      }

      let categoryName = Item.shopCategory;
      let categoryHex = '';
      if (categoryName.includes('_0x')) {
        categoryHex = categoryName.split('0x')[1];
        categoryName = lookupHash(parseInt(categoryHex, 16));
      } else {
        categoryHex = (categoryName.GetHashKey() >>> 0).toString(16);
      }

      let drawable = '';
      let albedo = '';
      let normal = '';
      let palette = '';
      let tint0 = 0;
      let tint1 = 0;
      let tint2 = 0;

      if (Item.assets['@_itemType'] === 'MetaPedDefExplicitAsset') {
        if (!Array.isArray(Item.assets.Item)) {
          const metaPedDef = Item.assets.Item;

          const processed = processMetaPedDef(metaPedDef);
          drawable = processed.drawable;
          albedo = processed.albedo;
          normal = processed.normal;
          palette = processed.palette;
          tint0 = processed.tint0 || null;
          tint1 = processed.tint1;
          tint2 = processed.tint2;
        } else {
          drawable = [];
          albedo = [];
          normal = [];
          palette = [];
          tint0 = [];
          tint1 = [];
          tint2 = [];

          for (const metaPedDef of Item.assets.Item) {
            const processed = processMetaPedDef(metaPedDef);
            drawable.push(processed.drawable);
            albedo.push(processed.albedo);
            normal.push(processed.normal);
            palette.push(processed.palette);
            tint0.push(processed.tint0);
            tint1.push(processed.tint1);
            tint2.push(processed.tint2);
          }
        }
      }

      if (palette.includes('_0x')) {
        const paletteHex = palette.split('_0x')[1].toUpperCase();
        palette = ColorPaletteNames[paletteHex] || palette;
      }

      let id = undefined;
      let tint = undefined;
      if (name) {
        let result = name.match(idTintRe);
        if (result) {
          id = Number(result[1]);
          tint = Number(result[2]);
        } else if (name.match(idRe)) {
          result = name.match(idRe);
          id = Number(result[1]);
        }
      }

      const data = {
        componentHex,
        component: parseInt(componentHex, 16),
        name,
        categoryHex,
        category: parseInt(categoryHex, 16),
        categoryName,
        type: ItemListName.includes('Male') ? '0' : '1',
        isMp: ItemListName.endsWith('Mp'),
        isSp: ItemListName.endsWith('Sp'),
        id,
        tint,
        friendlyName: GlobalStrings[componentHex.toUpperCase()] || '',
        palette,
        tint0,
        tint1,
        tint2,
        drawable,
        albedo,
        normal,
      };

      // if (componentHex === '554ce481') {
      //   console.log(data);
      //   console.log(lookupHash(data.component));
      // }

      let fileName = data.categoryName || `${data.category}`;

      if (!datas[fileName]) {
        datas[fileName] = [];
      }
      datas[fileName].push(data);
    } catch (e) {
      console.log(e);
      console.log(Item);
      console.log(Item.assets.Item);
      break;
    }
  }
}

// fs.writeFileSync('./temp/shop-items.json', JSON.stringify(datas, null, 2));

for (const [category, items] of Object.entries(datas)) {
  fs.writeFileSync(`../../../../[system]/rdr3-shared/components/${category}.json`, JSON.stringify(items, null, 2));
}

const fs = require('fs');
const path = require('path');

function getHashKey(text) {
  const keyLowered = text.toLowerCase();
  const length = keyLowered.length;
  let hash = 0;

  for (let i = 0; i < length; i++) {
    hash = (hash + keyLowered.charCodeAt(i)) | 0;
    hash = (hash + (hash << 10)) | 0;
    hash = (hash ^ (hash >>> 6)) | 0;
  }

  hash = (hash + (hash << 3)) | 0;
  hash = (hash ^ (hash >>> 11)) | 0;
  hash = (hash + (hash << 15)) | 0;

  return hash;
}

function toUnsigned(hash) {
  return hash >>> 0;
}

const componentsDir = path.join(__dirname, 'components-ui');
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.json'));

// Map: componentHash -> [drawableHash (unsigned), swatchTexture]
const drawableMap = {};

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(componentsDir, file), 'utf8'));

  for (const style of data) {
    if (!style.components) continue;

    for (const comp of style.components) {
      if (!comp.drawable || !comp.swatchTexture) continue;

      const componentHash = comp.component;
      const drawableHash = typeof comp.drawable === 'string'
        ? toUnsigned(getHashKey(comp.drawable))
        : toUnsigned(comp.drawable);

      drawableMap[String(componentHash)] = [drawableHash, comp.swatchTexture];
    }
  }
}

const outPath = path.join(__dirname, 'resources', 'drawable-map.json');
fs.writeFileSync(outPath, JSON.stringify(drawableMap));
console.log(`Written ${Object.keys(drawableMap).length} entries to ${outPath}`);

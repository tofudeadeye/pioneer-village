const fs = require('fs');
const fse = require('fs-extra');

const idTintRE = /.*?(_[MF]_)(.*?)_(\d+)_TINT_(\d+)/;

const files = fs.readdirSync('./components');

const componentNames = require('./component-names.js');

for (const file of files) {
  const components = fse.readJsonSync(`./components/${file}`);
  const miscComponents = [];
  const newComponents = {};
  for (const component of components) {
    const friendlyName = componentNames[component.component];
    if (component.name?.includes('_TINT_')) {
      const matches = idTintRE.exec(component.name);
      if (matches) {
        // if (component.name.includes('SEASON3_NIGHTCAP') || component.name.includes('_HAT_001_TINT_')) {
        //   console.log(matches);
        // }
        const id = Number(matches[3]);
        const tint = id >= 400 ? Number(matches[4]) : Number(matches[4]) - 1;
        component.id = id;
        component.tint = tint;

        if (friendlyName) {
          component.friendlyName = friendlyName;
        }

        const idNew = `${matches[2]}_${id}`;

        if (!newComponents[idNew]) {
          newComponents[idNew] = {
            name: friendlyName || component.id,
            components: [],
          };
        }

        newComponents[idNew].components.push(component);
      } else {
        miscComponents.push(component);
      }
    } else {
      if (friendlyName) {
        component.friendlyName = friendlyName;
      }
      miscComponents.push(component);
    }
  }

  fs.writeFileSync(
    `./components-ui/${file}`,
    JSON.stringify([{ name: 'Misc', components: miscComponents }, ...Object.values(newComponents)], null, 2),
  );
}

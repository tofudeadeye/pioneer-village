const fs = require('fs');
const fse = require('fs-extra');

const idTintRE = /.*?_(\d+)_TINT_(\d+)/;

const files = fs.readdirSync('./components');

// const componentNames = require('./component-names.js');

for (const file of files) {
  const components = fse.readJsonSync(`./components/${file}`);
  const miscComponents = [];
  const newComponents = {};
  for (const component of components) {
    const friendlyName = component.friendlyName;
    const id = component.id;
    if (id && component.isMp) {
      // if (component.name.includes('SEASON3_NIGHTCAP') || component.name.includes('_HAT_001_TINT_')) {
      //   console.log(matches);
      // }

      const idNew = `${friendlyName}_${id}`;

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
  }

  fs.writeFileSync(
    `./components-ui/${file}`,
    JSON.stringify([{ name: 'Misc', components: miscComponents }, ...Object.values(newComponents)], null, 2),
  );
}

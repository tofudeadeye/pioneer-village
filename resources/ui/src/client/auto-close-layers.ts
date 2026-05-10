import { emitUI, focusUI } from '@lib/client';

on('onResourceStop', (resourceName: string) => {
  switch (resourceName) {
    case 'customization':
      console.log('Closing customization layer');
      emitUI('customization.state', { show: false });
      focusUI(false, false);
      break;
  }
});
